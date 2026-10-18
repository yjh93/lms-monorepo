import { describe, expect, it } from 'vitest'
import { isApiError } from '../../http'
import { defaultStudentListQuery, studentFormDefaults } from '../../schemas/student'
import {
  createStudent,
  fetchStudent,
  fetchStudents,
  importStudents,
  updateStudent,
} from '../../students'
import { loginAs, setupMockServer } from '../../test/mockServer'
import { db } from '../db'

setupMockServer()

const newStudent = {
  ...studentFormDefaults,
  name: '테스트',
  email: 'test.user@example.com',
  phone: '01012345678',
  company: '한빛전자',
  enrolledAt: '2026-10-01',
}

describe('students mock API', () => {
  it('서버 페이지네이션: total은 전체 건수, items는 pageSize만큼', async () => {
    const page = await fetchStudents({ ...defaultStudentListQuery, page: 2, pageSize: 20 })
    expect(page.total).toBe(db.students.length)
    expect(page.items).toHaveLength(20)
    expect(page.page).toBe(2)
  })

  it('다중 필터 + 검색 + 정렬을 서버에서 적용한다', async () => {
    const page = await fetchStudents({
      ...defaultStudentListQuery,
      status: ['ACTIVE', 'PAUSED'],
      company: '한빛전자',
      sort: 'name',
      order: 'asc',
      pageSize: 50,
    })
    expect(page.items.length).toBeGreaterThan(0)
    for (const student of page.items) {
      expect(['ACTIVE', 'PAUSED']).toContain(student.status)
      expect(student.company).toBe('한빛전자')
    }
    const names = page.items.map((s) => s.name)
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'ko')))
  })

  it('등록 후 상세 조회가 가능하다', async () => {
    const created = await createStudent(newStudent)
    expect(created.id).toMatch(/^stu_/)
    await expect(fetchStudent(created.id)).resolves.toMatchObject({ name: '테스트' })
  })

  it('중복 이메일은 409와 필드 에러를 반환한다', async () => {
    const existing = db.students[0]!
    const error = await createStudent({ ...newStudent, email: existing.email }).catch((e) => e)
    expect(isApiError(error)).toBe(true)
    expect(error.status).toBe(409)
    expect(error.fieldErrors).toEqual({ email: '이미 등록된 이메일입니다.' })
  })

  it('서버 측 재검증: 스키마를 통과하지 못하면 422', async () => {
    const error = await createStudent({ ...newStudent, phone: '123' }).catch((e) => e)
    expect(error.status).toBe(422)
    expect(error.fieldErrors.phone).toBeDefined()
  })

  it('수정 시 updatedAt이 갱신된다', async () => {
    const target = db.students[3]!
    const updated = await updateStudent(target.id, {
      ...newStudent,
      email: target.email,
      status: 'PAUSED',
    })
    expect(updated.status).toBe('PAUSED')
    expect(updated.updatedAt > target.updatedAt).toBe(true)
  })
})

describe('students mock API: RBAC', () => {
  it('비로그인 요청은 401', async () => {
    loginAs(null)
    const error = await fetchStudents(defaultStudentListQuery).catch((e) => e)
    expect(error.status).toBe(401)
  })

  it('TEACHER는 조회만 가능하고 등록은 403', async () => {
    loginAs('TEACHER')
    await expect(fetchStudents(defaultStudentListQuery)).resolves.toBeDefined()
    const error = await createStudent(newStudent).catch((e) => e)
    expect(error.status).toBe(403)
  })
})

describe('students mock API: 감사 로그', () => {
  it('수정 시 변경된 필드만 이전→이후 값으로 기록한다', async () => {
    const target = db.students[3]!
    await updateStudent(target.id, {
      name: target.name,
      email: target.email,
      phone: target.phone,
      company: target.company,
      department: target.department,
      level: target.level,
      enrolledAt: target.enrolledAt,
      memo: target.memo,
      status: target.status === 'PAUSED' ? 'ACTIVE' : 'PAUSED',
    })
    const [log] = db.auditLogs
    expect(log).toMatchObject({
      action: 'STUDENT_UPDATED',
      actor: { role: 'ADMIN' },
      target: { id: target.id },
    })
    expect(log!.changes).toHaveLength(1)
    expect(log!.changes[0]!.field).toBe('status')
  })
})

describe('students mock API: CSV 일괄 등록', () => {
  it('유효한 행만 등록하고, 실패 행은 인덱스와 필드 에러를 돌려준다', async () => {
    const before = db.students.length
    const result = await importStudents([
      { ...newStudent, email: 'a@example.com' },
      { ...newStudent, email: db.students[0]!.email },
      { ...newStudent, email: 'a@example.com' },
      { ...newStudent, email: 'b@example.com', phone: '1' },
      { ...newStudent, email: 'c@example.com' },
    ])

    expect(result.createdCount).toBe(2)
    expect(result.errors.map((e) => e.index)).toEqual([1, 2, 3])
    expect(result.errors[2]!.fieldErrors.phone).toBeDefined()
    expect(db.students.length).toBe(before + 2)
    expect(db.auditLogs[0]).toMatchObject({ action: 'STUDENT_IMPORTED' })
  })

  it('MANAGER는 가능, TEACHER는 403', async () => {
    loginAs('MANAGER')
    await expect(importStudents([newStudent])).resolves.toMatchObject({ createdCount: 1 })
    loginAs('TEACHER')
    expect((await importStudents([newStudent]).catch((e) => e)).status).toBe(403)
  })
})
