import { request } from './http'
import {
  auditLogListResponseSchema,
  toAuditLogSearchParams,
  type AuditLogQuery,
} from './schemas/audit'

export function fetchAuditLogs(query: AuditLogQuery, signal?: AbortSignal) {
  return request('/audit-logs', {
    query: toAuditLogSearchParams(query),
    schema: auditLogListResponseSchema,
    signal,
  })
}
