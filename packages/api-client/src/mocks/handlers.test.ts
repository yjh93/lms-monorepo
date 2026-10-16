import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { configureApiClient, isApiError } from '../http'
import { defaultStudentListQuery, studentFormDefaults } from '../schemas/student'
import { createStudent, fetchStudent, fetchStudents, updateStudent } from '../students'
import { db, resetMockDb } from './db'
import { handlers } from './handlers'

const server = setupServer(...handlers)

beforeAll(() => {
  configureApiClient({ baseUrl: 'http://localhost/api' })
  server.listen({ onUnhandledFrame: 'error' })
})
afterEach(() => {
  server.resetHandlers()
  resetMockDb()
})
afterAll(() => server.close())

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
