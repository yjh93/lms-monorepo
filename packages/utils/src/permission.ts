/**
 * 역할 기반 접근 제어(RBAC) 정의.
 * - 역할(Role)은 "누구인가", 권한(Permission)은 "무엇을 할 수 있는가".
 * - UI는 역할이 아니라 권한으로 분기한다(`can(role, 'student:create')`).
 *   역할 구성이 바뀌어도 화면 코드를 고치지 않고 이 매핑만 바꾸면 된다.
 */
export const ROLES = ['ADMIN', 'MANAGER', 'TEACHER'] as const
export type Role = (typeof ROLES)[number]

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: '관리자',
  MANAGER: '운영 매니저',
  TEACHER: '강사',
}

export const PERMISSIONS = [
  'student:read',
  'student:create',
  'student:update',
  'student:delete',
  'student:import',
  'lesson:read',
  'lesson:manage',
  'attendance:check',
  'dashboard:read',
  'analytics:read',
  'audit:read',
] as const
export type Permission = (typeof PERMISSIONS)[number]

const ROLE_PERMISSIONS: Record<Role, ReadonlySet<Permission>> = {
  ADMIN: new Set(PERMISSIONS),
  MANAGER: new Set<Permission>([
    'student:read',
    'student:create',
    'student:update',
    'student:import',
    'lesson:read',
    'lesson:manage',
    'attendance:check',
    'dashboard:read',
    'analytics:read',
  ]),
  TEACHER: new Set<Permission>(['student:read', 'lesson:read', 'attendance:check']),
}

export function can(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role].has(permission)
}

export function canAll(role: Role | null | undefined, permissions: readonly Permission[]) {
  return permissions.every((permission) => can(role, permission))
}

export function permissionsOf(role: Role): Permission[] {
  return [...ROLE_PERMISSIONS[role]]
}

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
}
