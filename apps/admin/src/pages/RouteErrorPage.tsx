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
      <Link
        to="/"
        className="bg-brand-50 text-brand-600 mt-6 inline-flex h-11 items-center rounded-xl px-5 text-[15px] font-semibold"
      >
        처음으로
      </Link>
    </div>
  )
}
