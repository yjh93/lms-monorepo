import { formatPhone } from '@lms/utils'
import { delay, http, HttpResponse } from 'msw'
import {
  LEVEL_LABEL,
  parseStudentListQuery,
  STUDENT_STATUS_LABEL,
  studentFormSchema,
  studentImportRequestSchema,
  type Student,
  type StudentFormValues,
  type StudentImportResult,
  type StudentListQuery,
} from '../../schemas/student'
import { appendAuditLog, db, insertStudent } from '../db'
import { api, authorize, errorResponse, paginate, toActor, toFieldErrors } from '../http-utils'

function matchesQuery(student: Student, query: StudentListQuery) {
  if (query.status.length > 0 && !query.status.includes(student.status)) return false
  if (query.level.length > 0 && !query.level.includes(student.level)) return false
  if (query.company && student.company !== query.company) return false
  if (query.q) {
    const keyword = query.q.toLowerCase()
    const haystack = [student.name, student.email, student.phone, student.department]
      .join(' ')
      .toLowerCase()
    if (!haystack.includes(keyword)) return false
  }
  return true
}

function compareStudents(a: Student, b: Student, query: StudentListQuery) {
  const result = String(a[query.sort]).localeCompare(String(b[query.sort]), 'ko', { numeric: true })
  return query.order === 'asc' ? result : -result
}

function isDuplicateEmail(email: string, exceptId?: string) {
  return db.students.some((s) => s.email === email && s.id !== exceptId)
}

const FIELD_LABEL: Record<keyof StudentFormValues, string> = {
  name: '이름',
  email: '이메일',
  phone: '휴대폰 번호',
  company: '고객사',
  department: '부서',
  level: '레벨',
  status: '수강 상태',
  enrolledAt: '수강 시작일',
  memo: '메모',
}

function displayValue(field: keyof StudentFormValues, value: string) {
  if (field === 'level') return LEVEL_LABEL[value as Student['level']]
  if (field === 'status') return STUDENT_STATUS_LABEL[value as Student['status']]
  if (field === 'phone') return formatPhone(value)
  return value || '(없음)'
}

/** 감사 로그용 필드 단위 diff */
function diffStudent(before: Student, after: StudentFormValues) {
  return (Object.keys(FIELD_LABEL) as (keyof StudentFormValues)[])
    .filter((field) => before[field] !== after[field])
    .map((field) => ({
      field,
      label: FIELD_LABEL[field],
      from: displayValue(field, before[field]),
      to: displayValue(field, after[field]),
    }))
}

const duplicateEmail = () =>
  errorResponse(409, {
    message: '이미 등록된 이메일입니다.',
    fieldErrors: { email: '이미 등록된 이메일입니다.' },
  })

export const studentHandlers = [
  http.get(api('/students'), async ({ request }) => {
    await delay()
    const actor = authorize(request, 'student:read')
    if (actor instanceof Response) return actor

    const query = parseStudentListQuery(new URL(request.url).searchParams)
    const filtered = db.students
      .filter((student) => matchesQuery(student, query))
      .sort((a, b) => compareStudents(a, b, query))
    return HttpResponse.json(paginate(filtered, query.page, query.pageSize))
  }),

  http.get(api('/students/:id'), async ({ params, request }) => {
    await delay()
    const actor = authorize(request, 'student:read')
    if (actor instanceof Response) return actor

    const student = db.students.find((s) => s.id === params.id)
    if (!student) return errorResponse(404, { message: '수강생을 찾을 수 없습니다.' })
    return HttpResponse.json(student)
  }),

  http.post(api('/students'), async ({ request }) => {
    await delay()
    const actor = authorize(request, 'student:create')
    if (actor instanceof Response) return actor

    // 서버에서도 같은 zod 스키마로 재검증: 클라이언트 검증을 우회한 요청 방어
    const parsed = studentFormSchema.safeParse(await request.json())
    if (!parsed.success) {
      return errorResponse(422, {
        message: '입력값을 확인하세요.',
        fieldErrors: toFieldErrors(parsed.error.issues),
      })
    }
    if (isDuplicateEmail(parsed.data.email)) return duplicateEmail()

    const student = insertStudent(parsed.data)
    appendAuditLog({
      actor: toActor(actor),
      action: 'STUDENT_CREATED',
      target: { type: 'STUDENT', id: student.id, label: student.name },
      summary: `${student.name}(${student.company}) 수강생을 등록했습니다.`,
      changes: [],
    })
    return HttpResponse.json(student, { status: 201 })
  }),

  http.patch(api('/students/:id'), async ({ params, request }) => {
    await delay()
    const actor = authorize(request, 'student:update')
    if (actor instanceof Response) return actor

    const index = db.students.findIndex((s) => s.id === params.id)
    const current = db.students[index]
    if (!current) return errorResponse(404, { message: '수강생을 찾을 수 없습니다.' })

    const parsed = studentFormSchema.safeParse(await request.json())
    if (!parsed.success) {
      return errorResponse(422, {
        message: '입력값을 확인하세요.',
        fieldErrors: toFieldErrors(parsed.error.issues),
      })
    }
    if (isDuplicateEmail(parsed.data.email, current.id)) return duplicateEmail()

    const changes = diffStudent(current, parsed.data)
    const updated: Student = { ...current, ...parsed.data, updatedAt: new Date().toISOString() }
    db.students[index] = updated
    if (changes.length > 0) {
      appendAuditLog({
        actor: toActor(actor),
        action: 'STUDENT_UPDATED',
        target: { type: 'STUDENT', id: updated.id, label: updated.name },
        summary: `${updated.name} 수강생 정보 ${changes.length}건을 수정했습니다.`,
        changes,
      })
    }
    return HttpResponse.json(updated)
  }),

  /** CSV 일괄 등록: 행마다 재검증 + DB/요청 내 이메일 중복 검사, 유효한 행만 등록(부분 성공) */
  http.post(api('/students/import'), async ({ request }) => {
    await delay()
    const actor = authorize(request, 'student:import')
    if (actor instanceof Response) return actor

    const body = studentImportRequestSchema.safeParse(await request.json())
    if (!body.success) {
      return errorResponse(422, { message: '1~500행의 데이터를 전송하세요.' })
    }

    const result: StudentImportResult = { createdCount: 0, errors: [] }
    const seenEmails = new Set<string>()
    const created: Student[] = []

    body.data.rows.forEach((row, index) => {
      const parsed = studentFormSchema.safeParse(row)
      if (!parsed.success) {
        result.errors.push({ index, fieldErrors: toFieldErrors(parsed.error.issues) })
        return
      }
      if (isDuplicateEmail(parsed.data.email) || seenEmails.has(parsed.data.email)) {
        result.errors.push({ index, fieldErrors: { email: '이미 등록된 이메일입니다.' } })
        return
      }
      seenEmails.add(parsed.data.email)
      created.push(insertStudent(parsed.data))
    })

    result.createdCount = created.length
    if (created.length > 0) {
      appendAuditLog({
        actor: toActor(actor),
        action: 'STUDENT_IMPORTED',
        target: { type: 'STUDENT', id: created[0]!.id, label: `${created.length}명` },
        summary: `CSV로 수강생 ${created.length}명을 일괄 등록했습니다.`,
        changes: [],
      })
    }
    return HttpResponse.json(result)
  }),

  http.get(api('/companies'), async ({ request }) => {
    await delay()
    const actor = authorize(request, 'student:read')
    if (actor instanceof Response) return actor
    return HttpResponse.json([...new Set(db.students.map((s) => s.company))].sort())
  }),
]
