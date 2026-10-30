import { SITE_NAME } from '@/lib/site'

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-gray-50">
      <div className="mx-auto max-w-6xl px-5 py-10 text-[13px] text-gray-500">
        <p className="font-semibold text-gray-700">{SITE_NAME}</p>
        <p className="mt-2">기업 임직원 대상 비즈니스 어학교육 · 온라인 / 방문 / 혼합 수업</p>
        <p className="mt-4">이 사이트의 강좌·신청 데이터는 데모용 목 데이터입니다.</p>
      </div>
    </footer>
  )
}
