import {
  defaultStudentListQuery,
  parseStudentListQuery,
  STUDENT_SORT_KEYS,
  toStudentListSearchParams,
  type StudentListQuery,
  type StudentSortKey,
} from '@lms/api-client'
import type { PaginationState, SortingState } from '@lms/ui'
import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'

type Updater<T> = T | ((previous: T) => T)
const resolve = <T>(updater: Updater<T>, previous: T) =>
  typeof updater === 'function' ? (updater as (p: T) => T)(previous) : updater

const isSortKey = (id: string): id is StudentSortKey =>
  (STUDENT_SORT_KEYS as readonly string[]).includes(id)

/**
 * 수강생 목록 상태(페이지·정렬·필터·검색)의 단일 출처를 URL 쿼리로 둔다.
 * - 새로고침/공유/뒤로가기에도 같은 화면이 재현된다.
 * - 파싱·직렬화는 api-client의 zod 스키마를 그대로 사용(MSW 서버와 같은 규칙).
 * - 필터나 정렬이 바뀌면 1페이지로 돌아간다.
 */
export function useStudentListParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = useMemo(() => parseStudentListQuery(searchParams), [searchParams])

  const setQuery = useCallback(
    (patch: Partial<StudentListQuery>, options: { replace?: boolean } = {}) => {
      setSearchParams(
        (previous) => {
          const current = parseStudentListQuery(previous)
          const resetsPage = !('page' in patch)
          return toStudentListSearchParams({ ...current, ...patch, ...(resetsPage && { page: 1 }) })
        },
        { replace: options.replace },
      )
    },
    [setSearchParams],
  )

  const resetFilters = useCallback(() => {
    setSearchParams((previous) => {
      const { sort, order, pageSize } = parseStudentListQuery(previous)
      return toStudentListSearchParams({ ...defaultStudentListQuery, sort, order, pageSize })
    })
  }, [setSearchParams])

  // ── TanStack Table 상태 어댑터 ────────────────────────────
  const sorting = useMemo<SortingState>(
    () => [{ id: query.sort, desc: query.order === 'desc' }],
    [query.sort, query.order],
  )

  const onSortingChange = useCallback(
    (updater: Updater<SortingState>) => {
      const [next] = resolve(updater, sorting)
      if (!next || !isSortKey(next.id)) {
        setQuery({ sort: defaultStudentListQuery.sort, order: defaultStudentListQuery.order })
        return
      }
      setQuery({ sort: next.id, order: next.desc ? 'desc' : 'asc' })
    },
    [setQuery, sorting],
  )

  const pagination = useMemo<PaginationState>(
    () => ({ pageIndex: query.page - 1, pageSize: query.pageSize }),
    [query.page, query.pageSize],
  )

  const onPaginationChange = useCallback(
    (updater: Updater<PaginationState>) => {
      const next = resolve(updater, pagination)
      if (next.pageSize !== pagination.pageSize) {
        setQuery({ pageSize: next.pageSize as StudentListQuery['pageSize'] })
      } else {
        setQuery({ page: next.pageIndex + 1 })
      }
    },
    [pagination, setQuery],
  )

  const activeFilterCount =
    query.status.length + query.level.length + (query.company ? 1 : 0) + (query.q ? 1 : 0)

  return {
    query,
    setQuery,
    resetFilters,
    activeFilterCount,
    sorting,
    onSortingChange,
    pagination,
    onPaginationChange,
  }
}
