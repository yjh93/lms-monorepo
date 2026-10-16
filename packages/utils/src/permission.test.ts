import { describe, expect, it } from 'vitest'
import { can, canAll, isRole } from './permission'

describe('RBAC', () => {
  it('ADMIN은 모든 권한을 가진다', () => {
    expect(can('ADMIN', 'student:delete')).toBe(true)
    expect(can('ADMIN', 'audit:read')).toBe(true)
  })

  it('MANAGER는 삭제와 감사 로그 조회를 할 수 없다', () => {
    expect(can('MANAGER', 'student:create')).toBe(true)
    expect(can('MANAGER', 'student:delete')).toBe(false)
    expect(can('MANAGER', 'audit:read')).toBe(false)
  })

  it('TEACHER는 조회와 출석 체크만 가능하다', () => {
    expect(canAll('TEACHER', ['student:read', 'attendance:check'])).toBe(true)
    expect(can('TEACHER', 'student:update')).toBe(false)
  })

  it('역할이 없으면 모든 권한이 거부된다', () => {
    expect(can(null, 'student:read')).toBe(false)
  })

  it('isRole은 문자열 역할을 검증한다', () => {
    expect(isRole('MANAGER')).toBe(true)
    expect(isRole('GUEST')).toBe(false)
  })
})
