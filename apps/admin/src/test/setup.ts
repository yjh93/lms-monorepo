import '@testing-library/jest-dom/vitest'
import { configureApiClient } from '@lms/api-client'
import { resetMockDb } from '@lms/api-client/mocks'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './server'

beforeAll(() => {
  configureApiClient({ baseUrl: 'http://localhost/api' })
  server.listen({ onUnhandledFrame: 'error' })
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
  resetMockDb()
})

afterAll(() => server.close())
