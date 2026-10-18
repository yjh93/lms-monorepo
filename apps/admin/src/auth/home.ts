import type { Role } from '@lms/utils'

/** 로그인 후 첫 화면. 기능이 추가되면 역할별로 분기한다. */
export function homePathFor(_role: Role | null | undefined) {
  return '/students'
}
