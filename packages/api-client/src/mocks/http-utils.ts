import { can, type Permission } from '@lms/utils'
import { HttpResponse } from 'msw'
import { DEMO_USER_HEADER, type AuthUser } from '../schemas/auth'
import type { ApiErrorBody } from '../schemas/common'
import { DEMO_USERS } from './db'

/** 목 API 경로. 앞의 '*'로 상대 경로(/api)와 절대 경로(http://host/api) 모두 매칭한다. */
export const api = (path: string) => `*/api${path}`

export function errorResponse(status: number, body: ApiErrorBody) {
  return HttpResponse.json(body, { status })
}

/** zod 에러를 { 필드: 첫 번째 메시지 } 형태로 변환 */
export function toFieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {}
  for (const issue of issues) {
    const key = issue.path.join('.')
    fieldErrors[key] ??= issue.message
  }
  return fieldErrors
}

/**
 * 서버 측 RBAC. 화면에서 버튼을 숨기는 것만으로는 권한 제어가 아니므로
 * 목 서버도 요청 주체의 권한을 검사해 401/403을 돌려준다.
 */
export function authorize(request: Request, permission: Permission): AuthUser | Response {
  const userId = request.headers.get(DEMO_USER_HEADER)
  const user = DEMO_USERS.find((u) => u.id === userId)
  if (!user) return errorResponse(401, { message: '로그인이 필요합니다.' })
  if (!can(user.role, permission)) return errorResponse(403, { message: '권한이 없습니다.' })
  return user
}

export function toActor(user: AuthUser) {
  return { id: user.id, name: user.name, role: user.role }
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize
  return { items: items.slice(start, start + pageSize), total: items.length, page, pageSize }
}
