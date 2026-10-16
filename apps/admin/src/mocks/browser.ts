import { handlers } from '@lms/api-client/mocks'
import { setupWorker } from 'msw/browser'

export const worker = setupWorker(...handlers)
