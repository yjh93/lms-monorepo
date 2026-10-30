import { CourseGridSkeleton } from '@/components/CourseCard'

/**
 * 목록 전용 로딩 UI. (list) 라우트 그룹에 두어 상세 페이지([slug])는 감싸지 않는다.
 * 상세까지 감싸면 로딩 셸이 먼저 200으로 전송되어, 없는 강좌의 notFound()가 404 상태 코드를 못 낸다.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-5 pt-14" aria-busy>
      <div className="h-10 w-32 animate-pulse rounded-xl bg-gray-100" />
      <div className="mt-10">
        <CourseGridSkeleton />
      </div>
    </div>
  )
}
