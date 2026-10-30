import { configureApiClient, DEMO_USER_HEADER } from '@lms/api-client'
import { handlers } from '@lms/api-client/mocks'
import { setupServer } from 'msw/node'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { useStudentList } from './useStudentList'

const server = setupServer(...handlers)

beforeAll(() => {
  configureApiClient({
    baseUrl: 'http://localhost/api',
    getHeaders: () => ({ [DEMO_USER_HEADER]: 'usr_admin' }),
  })
  server.listen({ onUnhandledFrame: 'error' })
})
afterAll(() => server.close())

describe('useStudentList (레거시 Vue)', () => {
  it('React 어드민과 같은 URL 규칙으로 초기 상태를 복원한다', async () => {
    const { query, result } = useStudentList({ search: '?status=PAUSED&page=2&pageSize=20' })
    expect(query).toMatchObject({ status: ['PAUSED'], page: 2, pageSize: 20 })

    await vi.waitFor(() => expect(result.value?.page).toBe(2))
    for (const student of result.value!.items) expect(student.status).toBe('PAUSED')
  })

  it('필터를 바꾸면 1페이지로 돌아가고 URL에 반영한다', async () => {
    const list = useStudentList({ search: '?page=3' })
    await vi.waitFor(() => expect(list.result.value?.page).toBe(3))

    list.update({ status: ['ACTIVE'] })

    expect(list.query.page).toBe(1)
    await vi.waitFor(() => expect(window.location.search).toBe('?status=ACTIVE'))
    await vi.waitFor(() =>
      expect(list.result.value?.items.every((s) => s.status === 'ACTIVE')).toBe(true),
    )
  })
})
