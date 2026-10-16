import { delay, http, HttpResponse } from 'msw'
import type { ApiErrorBody, Paginated } from '../schemas/common'
import {
  parseStudentListQuery,
  studentFormSchema,
  type Student,
  type StudentListQuery,
} from '../schemas/student'
import { db, insertStudent } from './db'

/** 목 API 경로. 앞의 '*'로 상대 경로(/api)와 절대 경로(http://host/api) 모두 매칭한다. */
const api = (path: string) => `*/api${path}`

function errorResponse(status: number, body: ApiErrorBody) {
  return HttpResponse.json(body, { status })
}

/** zod 에러를 { 필드: 첫 번째 메시지 } 형태로 변환 */
function toFieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {}
  for (const issue of issues) {
    const key = issue.path.join('.')
    fieldErrors[key] ??= issue.message
  }
  return fieldErrors
}

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

export const studentHandlers = [
  http.get(api('/students'), async ({ request }) => {
    await delay()
    const query = parseStudentListQuery(new URL(request.url).searchParams)
    const filtered = db.students
      .filter((student) => matchesQuery(student, query))
      .sort((a, b) => compareStudents(a, b, query))
    const start = (query.page - 1) * query.pageSize
    const body: Paginated<Student> = {
      items: filtered.slice(start, start + query.pageSize),
      total: filtered.length,
      page: query.page,
      pageSize: query.pageSize,
    }
    return HttpResponse.json(body)
  }),

  http.get(api('/students/:id'), async ({ params }) => {
    await delay()
    const student = db.students.find((s) => s.id === params.id)
    if (!student) return errorResponse(404, { message: '수강생을 찾을 수 없습니다.' })
    return HttpResponse.json(student)
  }),

  http.post(api('/students'), async ({ request }) => {
    await delay()
    // 서버에서도 같은 zod 스키마로 재검증: 클라이언트 검증을 우회한 요청 방어
    const parsed = studentFormSchema.safeParse(await request.json())
    if (!parsed.success) {
      return errorResponse(422, {
        message: '입력값을 확인하세요.',
        fieldErrors: toFieldErrors(parsed.error.issues),
      })
    }
    if (isDuplicateEmail(parsed.data.email)) {
      return errorResponse(409, {
        message: '이미 등록된 이메일입니다.',
        fieldErrors: { email: '이미 등록된 이메일입니다.' },
      })
    }
    return HttpResponse.json(insertStudent(parsed.data), { status: 201 })
  }),

  http.patch(api('/students/:id'), async ({ params, request }) => {
    await delay()
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
    if (isDuplicateEmail(parsed.data.email, current.id)) {
      return errorResponse(409, {
        message: '이미 등록된 이메일입니다.',
        fieldErrors: { email: '이미 등록된 이메일입니다.' },
      })
    }
    const updated: Student = { ...current, ...parsed.data, updatedAt: new Date().toISOString() }
    db.students[index] = updated
    return HttpResponse.json(updated)
  }),

  http.get(api('/companies'), async () => {
    await delay()
    return HttpResponse.json([...new Set(db.students.map((s) => s.company))].sort())
  }),
]

export const handlers = [...studentHandlers]
