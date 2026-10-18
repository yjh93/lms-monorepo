import { ROLE_LABEL } from '@lms/utils'
import { Link } from 'react-router'
import { useAuthUser } from '../auth/authStore'

export function ForbiddenPage() {
  const user = useAuthUser()
  return (
    <div role="alert" className="py-24 text-center">
      <p className="text-brand-600 text-sm font-semibold">403</p>
      <h1 className="mt-2 text-2xl font-bold">접근 권한이 없습니다</h1>
      <p className="mt-2 text-sm text-gray-500">
        {user ? `${ROLE_LABEL[user.role]} 역할로는 이 화면을 사용할 수 없습니다.` : null}
      </p>
      <Link to="/" className="text-brand-600 mt-4 inline-block text-sm hover:underline">
        처음으로
      </Link>
    </div>
  )
}
