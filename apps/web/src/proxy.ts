import { createCourseFixtures } from '@lms/api-client/fixtures'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Cache Components에서는 알 수 없는 강좌 주소도 미리 만든 셸이 먼저 200으로 스트리밍되어,
 * 페이지 안의 notFound()로는 HTTP 상태를 404로 바꿀 수 없다(noindex만 주입됨).
 * 렌더링 전에 실행되는 proxy에서 없는 강좌를 걸러 실제 404 응답을 돌려준다.
 */
const knownSlugs = new Set(createCourseFixtures().map((course) => course.slug))

export function proxy(request: NextRequest) {
  const slug = request.nextUrl.pathname.split('/')[2]
  if (slug && !knownSlugs.has(slug)) {
    // 존재하지 않는 경로로 rewrite하면 루트 not-found UI가 404 상태로 렌더링된다.
    return NextResponse.rewrite(new URL('/_course-not-found', request.url))
  }
  return NextResponse.next()
}

export const config = {
  // 강좌 상세(및 OG 이미지)만 대상. 목록(/courses)은 제외
  matcher: '/courses/:slug/:path*',
}
