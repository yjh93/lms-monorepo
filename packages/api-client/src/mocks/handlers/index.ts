import { auditHandlers } from './audit'
import { authHandlers } from './auth'
import { dashboardHandlers } from './dashboard'
import { lessonHandlers } from './lessons'
import { studentHandlers } from './students'

export { auditHandlers, authHandlers, dashboardHandlers, lessonHandlers, studentHandlers }

export const handlers = [
  ...authHandlers,
  ...studentHandlers,
  ...lessonHandlers,
  ...dashboardHandlers,
  ...auditHandlers,
]
