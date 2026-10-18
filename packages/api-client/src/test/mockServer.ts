import type { Role } from '@lms/utils'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import { configureApiClient } from '../http'
import { DEMO_USER_HEADER } from '../schemas/auth'
import { DEMO_USERS, resetMockDb } from '../mocks/db'
import { handlers } from '../mocks/handlers'

let currentUserId: string | null = null

/** 이후 요청을 해당 역할의 데모 계정으로 보낸다. null이면 비로그인. */
export function loginAs(role: Role | null) {
  currentUserId = role ? DEMO_USERS.find((u) => u.role === role)!.id : null
}

/** 테스트 파일마다 MSW Node 서버 수명주기를 설정한다. 기본 사용자는 ADMIN. */
export function setupMockServer() {
  const server = setupServer(...handlers)

  beforeAll(() => {
    configureApiClient({
      baseUrl: 'http://localhost/api',
      getHeaders: (): Record<string, string> =>
        currentUserId ? { [DEMO_USER_HEADER]: currentUserId } : {},
    })
    server.listen({ onUnhandledFrame: 'error' })
  })
  beforeEach(() => loginAs('ADMIN'))
  afterEach(() => {
    server.resetHandlers()
    resetMockDb()
  })
  afterAll(() => server.close())

  return server
}
