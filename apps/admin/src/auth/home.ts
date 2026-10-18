import { can, type Role } from '@lms/utils'

/** 로그인 후 첫 화면: 강사는 수업 목록, 그 외는 수강생 목록 */
export function homePathFor(role: Role | null | undefined) {
  return can(role, 'student:update') ? '/students' : '/lessons'
}
