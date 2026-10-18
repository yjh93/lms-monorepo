import type { Permission } from '@lms/utils'
import type { ReactNode } from 'react'
import { usePermission } from './usePermission'

interface CanProps {
  permission: Permission
  children: ReactNode
  fallback?: ReactNode
}

/** 버튼/링크 단위 권한 제어. 서버(MSW)도 같은 권한표로 403을 반환하므로 UI 제어는 사용성 목적이다. */
export function Can({ permission, children, fallback = null }: CanProps) {
  return usePermission(permission) ? children : fallback
}
