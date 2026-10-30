import Link from 'next/link'
import { SITE_NAME } from '@/lib/site'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2">
          <span
            aria-hidden
            className="bg-brand-500 flex size-7 items-center justify-center rounded-lg text-sm font-bold text-white"
          >
            L
          </span>
          <span className="text-[17px] font-bold tracking-[-0.02em]">{SITE_NAME}</span>
        </Link>
        <nav aria-label="주 메뉴" className="flex items-center gap-1 text-[15px] font-semibold">
          <Link href="/courses" className="rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100">
            강좌
          </Link>
          <Link
            href="/courses?format=ONSITE"
            className="hidden rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 sm:block"
          >
            방문 수업
          </Link>
        </nav>
      </div>
    </header>
  )
}
