import { can, type Permission } from '@lms/utils'
import { useAuthUser } from './authStore'

/** 현재 사용자가 권한을 가졌는지. UI는 역할이 아니라 권한으로 분기한다. */
export function usePermission(permission: Permission) {
  const user = useAuthUser()
  return can(user?.role, permission)
}
