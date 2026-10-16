import { cn } from '@lms/ui'
import { NavLink, Outlet } from 'react-router'

const NAV_ITEMS = [{ to: '/students', label: '수강생' }] as const

export function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 border-r border-gray-200 bg-white md:block">
        <div className="px-5 py-5 text-base font-bold text-gray-900">LMS 운영 어드민</div>
        <nav aria-label="주 메뉴" className="flex flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => (
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
      </aside>
      <main className="min-w-0 flex-1 px-6 py-8 lg:px-10">
        <Outlet />
      </main>
    </div>
  )
}
