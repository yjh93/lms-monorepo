import { ATTENDANCE_STATUS_LABEL, type AttendanceStatus } from '@lms/api-client'
import { Badge, cn, type BadgeTone } from '@lms/ui'
import { formatNumber } from '@lms/utils'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useRef } from 'react'
import { useAnalyticsStore } from './analyticsStore'
import { useAttendanceRows } from './analyticsQueries'
import { WEEKDAY_LABEL, type SortKey } from './engine/types'

const STATUS_TONE: Record<AttendanceStatus, BadgeTone> = {
  PRESENT: 'success',
  LATE: 'warning',
  ABSENT: 'danger',
  EXCUSED: 'neutral',
}

const COLUMNS = 'grid-cols-[8.5rem_4rem_6rem_7rem_1fr_9rem_5rem]'
const ROW_HEIGHT = 48

/**
 * 출석 로그 가상 스크롤 목록.
 * - 워커에서 커서 기반으로 200건씩 받아 오고(useInfiniteQuery),
 * - 화면에 보이는 행(+여유분)만 DOM에 그린다(TanStack Virtual).
 * 수십만 건이어도 DOM 노드는 수십 개 수준으로 유지된다.
 */
export function AttendanceLogTable() {
  const filters = useAnalyticsStore((s) => s.filters)
  const sort = useAnalyticsStore((s) => s.sort)
  const setSort = useAnalyticsStore((s) => s.setSort)
  const query = useAttendanceRows(filters, sort)

  const rows = query.data?.pages.flatMap((page) => page.rows) ?? []
  const matched = query.data?.pages[0]?.matched ?? 0
  const scrollRef = useRef<HTMLDivElement>(null)

  // 가상화 라이브러리는 측정 함수 등을 매 렌더 새로 돌려줘 메모이제이션 대상이 아니다.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: query.hasNextPage ? rows.length + 1 : rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
    // 첫 측정 전(및 레이아웃이 없는 환경)에도 목록 높이만큼은 그린다.
    initialRect: { width: 0, height: 560 },
  })
  const items = virtualizer.getVirtualItems()
  const lastIndex = items.at(-1)?.index ?? 0

  // 마지막 근처까지 스크롤하면 다음 페이지를 요청한다.
  useEffect(() => {
    if (lastIndex >= rows.length - 1 && query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage()
    }
  }, [lastIndex, rows.length, query])

  // 필터·정렬이 바뀌면 맨 위로
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [filters, sort])

  const header = (key: SortKey, label: string) => (
    <button
      type="button"
      onClick={() => setSort(key)}
      className="-mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-1 hover:bg-gray-100"
      aria-label={`${label} 정렬`}
    >
      {label}
      <span
        aria-hidden
        className={cn('text-[10px]', sort.key === key ? 'text-brand-500' : 'text-gray-300')}
      >
        {sort.key === key ? (sort.desc ? '▼' : '▲') : '↕'}
      </span>
    </button>
  )

  return (
    <section aria-label="출석 로그" className="rounded-card overflow-hidden bg-white">
      <header className="flex items-center justify-between px-6 pt-6 pb-3">
        <div>
          <h2 className="text-[17px] font-bold text-gray-900">출석 로그</h2>
          <p className="mt-1 text-[13px] text-gray-500">
            {formatNumber(matched)}건 중 {formatNumber(rows.length)}건 불러옴 · 스크롤하면 이어서
            불러옵니다
          </p>
        </div>
        {query.data?.pages.at(-1) && (
          <span className="text-[13px] text-gray-400 tabular-nums">
            최근 페이지 {query.data.pages.at(-1)!.elapsedMs}ms
          </span>
        )}
      </header>

      <div
        role="table"
        aria-label="출석 로그"
        aria-rowcount={matched + 1}
        aria-busy={query.isFetching || undefined}
        className="overflow-x-auto"
      >
        <div className="min-w-[860px]">
          <div
            role="row"
            className={cn(
              'grid h-11 items-center border-b border-gray-100 px-6 text-[13px] font-medium text-gray-500',
              COLUMNS,
            )}
          >
            <span role="columnheader">{header('date', '일시')}</span>
            <span role="columnheader">요일</span>
            <span role="columnheader">{header('student', '수강생')}</span>
            <span role="columnheader">{header('company', '고객사')}</span>
            <span role="columnheader">강좌</span>
            <span role="columnheader">강사</span>
            <span role="columnheader">상태</span>
          </div>

          <div ref={scrollRef} className="h-[560px] overflow-y-auto">
            {query.isPending ? (
              <p className="py-20 text-center text-gray-500">불러오는 중…</p>
            ) : rows.length === 0 ? (
              <p className="py-20 text-center text-gray-500">조건에 맞는 기록이 없습니다.</p>
            ) : (
              <div className="relative" style={{ height: virtualizer.getTotalSize() }}>
                {items.map((item) => {
                  const row = rows[item.index]
                  return (
                    <div
                      key={item.key}
                      role="row"
                      aria-rowindex={item.index + 2}
                      className={cn(
                        'absolute inset-x-0 grid items-center px-6 text-[14px] text-gray-800 hover:bg-gray-50',
                        COLUMNS,
                      )}
                      style={{ height: item.size, transform: `translateY(${item.start}px)` }}
                    >
                      {row ? (
                        <>
                          <span role="cell" className="tabular-nums">
                            {row.date} <span className="text-gray-500">{row.time}</span>
                          </span>
                          <span role="cell" className="text-gray-600">
                            {WEEKDAY_LABEL[row.weekday]}
                          </span>
                          <span role="cell" className="font-semibold text-gray-900">
                            {row.student}
                          </span>
                          <span role="cell">{row.company}</span>
                          <span role="cell" className="truncate text-gray-600">
                            {row.course}
                          </span>
                          <span role="cell" className="truncate text-gray-600">
                            {row.teacher}
                          </span>
                          <span role="cell">
                            <Badge tone={STATUS_TONE[row.status]}>
                              {ATTENDANCE_STATUS_LABEL[row.status]}
                            </Badge>
                          </span>
                        </>
                      ) : (
                        <span
                          role="cell"
                          className="col-span-full text-center text-[13px] text-gray-400"
                        >
                          더 불러오는 중…
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
