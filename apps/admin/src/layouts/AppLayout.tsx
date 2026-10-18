import { Badge, Button, cn } from '@lms/ui'
import { can, ROLE_LABEL, type Permission } from '@lms/utils'
import { useQueryClient } from '@tanstack/react-query'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { authStore, useAuthUser } from '../auth/authStore'

interface NavItem {
  to: string
  label: string
  permission: Permission
}

/** 메뉴도 권한표로 거른다. 권한 없는 메뉴는 아예 보이지 않는다. */
const NAV_ITEMS: NavItem[] = [
  { to: '/students', label: '수강생', permission: 'student:read' },
  { to: '/lessons', label: '수업/출석', permission: 'lesson:read' },
  { to: '/audit-logs', label: '변경 이력', permission: 'audit:read' },
]

export function AppLayout() {
  const user = useAuthUser()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const logout = () => {
    authStore.setUser(null)
    queryClient.clear()
    navigate('/login', { replace: true })
  }

  const items = NAV_ITEMS.filter((item) => can(user?.role, item.permission))

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-gray-200 bg-white md:flex">
        <div className="px-5 py-5 text-base font-bold text-gray-900">LMS 운영 어드민</div>
        <nav aria-label="주 메뉴" className="flex flex-col gap-1 px-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-2 text-sm font-medium',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        {user && (
          <div className="mt-auto border-t border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <Badge tone="brand" className="mt-1">
              {ROLE_LABEL[user.role]}
            </Badge>
            <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={logout}>
              로그아웃
            </Button>
          </div>
        )}
      </aside>
      <main className="min-w-0 flex-1 px-6 py-8 lg:px-10">
        <Outlet />
      </main>
    </div>
  )
}
