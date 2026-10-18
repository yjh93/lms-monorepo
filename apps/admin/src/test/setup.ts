import '@testing-library/jest-dom/vitest'
import { resetMockDb } from '@lms/api-client/mocks'
import { cleanup, configure } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { setupApiClient } from '../app/apiClient'
import { authStore } from '../auth/authStore'
import { server } from './server'

// turbo가 여러 패키지 테스트를 동시에 돌리면 CPU 경쟁으로 응답이 늦어진다. 기본 1초 대기는 CI에서 불안정하다.
configure({ asyncUtilTimeout: 3000 })

beforeAll(() => {
  setupApiClient('http://localhost/api')
  server.listen({ onUnhandledFrame: 'error' })
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
  resetMockDb()
  authStore.setUser(null)
})

afterAll(() => server.close())
