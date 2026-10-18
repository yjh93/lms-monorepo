import { ROLES } from '@lms/utils'
import { z } from 'zod'
import { roleSchema } from './auth'
import {
  createSearchParamsCodec,
  enumArrayParam,
  pageParam,
  pageSizeParam,
  paginatedSchema,
} from './common'

export const AUDIT_ACTIONS = [
  'STUDENT_CREATED',
  'STUDENT_UPDATED',
  'STUDENT_IMPORTED',
  'ATTENDANCE_CHANGED',
] as const
export const auditActionSchema = z.enum(AUDIT_ACTIONS)
export type AuditAction = z.infer<typeof auditActionSchema>

export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  STUDENT_CREATED: '수강생 등록',
  STUDENT_UPDATED: '수강생 수정',
  STUDENT_IMPORTED: '수강생 일괄 등록',
  ATTENDANCE_CHANGED: '출석 변경',
}

export const auditLogSchema = z.object({
  id: z.string(),
  at: z.iso.datetime(),
  actor: z.object({ id: z.string(), name: z.string(), role: roleSchema }),
  action: auditActionSchema,
  target: z.object({
    type: z.enum(['STUDENT', 'LESSON']),
    id: z.string(),
    label: z.string(),
  }),
  summary: z.string(),
  /** 필드 단위 변경 내역(이전 → 이후). 표시용 문자열로 저장한다. */
  changes: z.array(
    z.object({ field: z.string(), label: z.string(), from: z.string(), to: z.string() }),
  ),
})
export type AuditLog = z.infer<typeof auditLogSchema>

export const auditLogListResponseSchema = paginatedSchema(auditLogSchema)

export const auditLogQuerySchema = z.object({
  page: pageParam,
  pageSize: pageSizeParam(20),
  action: enumArrayParam(AUDIT_ACTIONS),
  role: enumArrayParam(ROLES),
  q: z.string().trim().catch(''),
})
export type AuditLogQuery = z.output<typeof auditLogQuerySchema>

const auditLogCodec = createSearchParamsCodec(auditLogQuerySchema, ['action', 'role'])
export const defaultAuditLogQuery: AuditLogQuery = auditLogCodec.defaults
export const parseAuditLogQuery = auditLogCodec.parse
export const toAuditLogSearchParams = auditLogCodec.serialize
