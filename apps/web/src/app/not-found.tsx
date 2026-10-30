import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-5 py-32 text-center">
      <p className="text-brand-500 text-[15px] font-bold">404</p>
      <h1 className="mt-2 text-[28px] font-bold tracking-[-0.02em]">찾는 페이지가 없어요</h1>
      <p className="mt-3 text-[16px] text-gray-600">주소가 바뀌었거나 종료된 강좌일 수 있어요.</p>
      <Link
        href="/courses"
        className="bg-brand-50 text-brand-600 mt-8 inline-flex h-12 items-center rounded-xl px-6 text-[15px] font-semibold"
      >
        강좌 목록 보기
      </Link>
    </div>
  )
}
