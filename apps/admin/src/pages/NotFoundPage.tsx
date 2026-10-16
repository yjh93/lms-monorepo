import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <div className="py-24 text-center">
      <h1 className="text-2xl font-bold">페이지를 찾을 수 없습니다</h1>
      <Link to="/" className="text-brand-600 mt-4 inline-block text-sm hover:underline">
        처음으로
      </Link>
    </div>
  )
}
