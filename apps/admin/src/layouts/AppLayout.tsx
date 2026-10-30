import { cn } from '@lms/ui'
import { can, ROLE_LABEL, type Permission } from '@lms/utils'
import { useQueryClient } from '@tanstack/react-query'
import type { ComponentType, SVGProps } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { authStore, useAuthUser } from '../auth/authStore'
import {
  CalendarIcon,
  ChartIcon,
  DashboardIcon,
  HistoryIcon,
  LogoutIcon,
  UsersIcon,
} from '../components/icons'

interface NavItem {
  to: string
  label: string
  permission: Permission
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

/** 메뉴도 권한표로 거른다. 권한 없는 메뉴는 아예 보이지 않는다. */
const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: '대시보드', permission: 'dashboard:read', icon: DashboardIcon },
  { to: '/students', label: '수강생', permission: 'student:read', icon: UsersIcon },
  { to: '/lessons', label: '수업/출석', permission: 'lesson:read', icon: CalendarIcon },
  { to: '/analytics', label: '출석 분석', permission: 'analytics:read', icon: ChartIcon },
  { to: '/audit-logs', label: '변경 이력', permission: 'audit:read', icon: HistoryIcon },
]

export function AppLayout() {
  const user = useAuthUser()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const logout = () => {
    authStore.signOut()
    queryClient.clear()
    navigate('/login', { replace: true })
  }

  const items = NAV_ITEMS.filter((item) => can(user?.role, item.permission))

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-white px-4 py-6 md:flex">
        <div className="mb-8 flex items-center gap-2 px-3">
          <span
            aria-hidden
            className="bg-brand-500 flex size-7 items-center justify-center rounded-lg text-sm font-bold text-white"
          >
            L
          </span>
          <span className="text-[17px] font-bold tracking-[-0.02em] text-gray-900">LMS 운영</span>
        </div>

        <nav aria-label="주 메뉴" className="flex flex-col gap-1">
          {items.map(({ to, label, icon: ItemIcon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800',
                )
              }
            >
              <ItemIcon className="size-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        {user && (
          <div className="mt-auto flex items-center gap-3 rounded-2xl bg-gray-50 p-3">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-700"
            >
              {user.name.slice(0, 1)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-gray-900">{user.name}</p>
              <p className="text-[13px] text-gray-500">{ROLE_LABEL[user.role]}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              aria-label="로그아웃"
              title="로그아웃"
              className="flex size-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-700"
            >
              <LogoutIcon className="size-5" />
            </button>
          </div>
        )}
      </aside>

      <main className="min-w-0 flex-1 px-5 py-8 md:px-10 md:py-10">
        <div className="mx-auto max-w-[1200px]">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
