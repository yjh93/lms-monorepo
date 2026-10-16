import { isRouteErrorResponse, Link, useRouteError } from 'react-router'

export function RouteErrorPage() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : '알 수 없는 오류가 발생했습니다.'

  return (
    <div role="alert" className="py-24 text-center">
      <h1 className="text-2xl font-bold">문제가 발생했습니다</h1>
      <p className="mt-2 text-sm text-gray-500">{message}</p>
      <Link to="/" className="text-brand-600 mt-4 inline-block text-sm hover:underline">
        처음으로
      </Link>
    </div>
  )
}
