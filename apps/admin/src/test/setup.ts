import '@testing-library/jest-dom/vitest'
import { resetMockDb } from '@lms/api-client/mocks'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { setupApiClient } from '../app/apiClient'
import { authStore } from '../auth/authStore'
import { server } from './server'

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
