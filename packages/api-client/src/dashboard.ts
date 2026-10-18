import { request } from './http'
import { dashboardSchema } from './schemas/dashboard'

export function fetchDashboard(signal?: AbortSignal) {
  return request('/dashboard', { schema: dashboardSchema, signal })
}
