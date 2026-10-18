import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <div className="py-24 text-center">
      <h1 className="text-2xl font-bold">페이지를 찾을 수 없습니다</h1>
      <Link
        to="/"
        className="bg-brand-50 text-brand-600 mt-6 inline-flex h-11 items-center rounded-xl px-5 text-[15px] font-semibold"
      >
        처음으로
      </Link>
    </div>
  )
}
