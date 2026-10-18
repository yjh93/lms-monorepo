import { can, type Permission } from '@lms/utils'
import { Navigate, Outlet, useLocation } from 'react-router'
import { ForbiddenPage } from '../pages/ForbiddenPage'
import { useAuthUser } from './authStore'
import { homePathFor } from './home'

/** 로그인하지 않았으면 로그인 페이지로. 돌아올 경로는 location.state.from으로 전달한다. */
export function RequireAuth() {
  const user = useAuthUser()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}

/** 라우트 단위 권한 가드. URL을 직접 입력해 들어와도 403 화면을 보여준다. */
export function RequirePermission({ permission }: { permission: Permission }) {
  const user = useAuthUser()
  if (!can(user?.role, permission)) return <ForbiddenPage />
  return <Outlet />
}

export function HomeRedirect() {
  const user = useAuthUser()
  return <Navigate to={homePathFor(user?.role)} replace />
}
