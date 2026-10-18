import { can, type Role } from '@lms/utils'

/** 로그인 후 첫 화면: 대시보드 권한이 없으면(강사) 수업 목록으로 */
export function homePathFor(role: Role | null | undefined) {
  return can(role, 'dashboard:read') ? '/dashboard' : '/lessons'
}
