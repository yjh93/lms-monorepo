import { keepPreviousData, useInfiniteQuery, useQuery, type QueryKey } from '@tanstack/react-query'
import { createContext, use } from 'react'
import { createWorkerClient } from './engine/client'
import type { AnalyticsClient, AnalyticsFilters, SortState } from './engine/types'

let defaultClient: AnalyticsClient | null = null

/** 워커는 화면에 처음 들어올 때 한 번만 만든다(데이터셋 생성 비용이 크다). */
function getDefaultClient() {
  return (defaultClient ??= createWorkerClient())
}

/** 테스트에서는 워커 대신 메인 스레드 구현을 주입한다. */
export const AnalyticsClientContext = createContext<AnalyticsClient | null>(null)

function useClient() {
  return use(AnalyticsClientContext) ?? getDefaultClient()
}

const keys = {
  info: ['analytics', 'info'] as QueryKey,
  aggregate: (filters: AnalyticsFilters) => ['analytics', 'aggregate', filters] as QueryKey,
  rows: (filters: AnalyticsFilters, sort: SortState) =>
    ['analytics', 'rows', filters, sort] as QueryKey,
}

/**
 * 워커도 TanStack Query로 감싸면 "원격 서버"처럼 다룰 수 있다.
 * 필터 조합별로 집계 결과가 캐시되고, 같은 조합으로 돌아오면 다시 계산하지 않는다.
 */
export function useDatasetInfo() {
  const client = useClient()
  return useQuery({ queryKey: keys.info, queryFn: () => client.info(), staleTime: Infinity })
}

export function useAggregate(filters: AnalyticsFilters) {
  const client = useClient()
  return useQuery({
    queryKey: keys.aggregate(filters),
    queryFn: () => client.aggregate(filters),
    staleTime: Infinity,
    placeholderData: keepPreviousData,
  })
}

export const PAGE_SIZE = 200

export function useAttendanceRows(filters: AnalyticsFilters, sort: SortState) {
  const client = useClient()
  return useInfiniteQuery({
    queryKey: keys.rows(filters, sort),
    queryFn: ({ pageParam }) => client.rows(filters, sort, pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: Infinity,
    placeholderData: keepPreviousData,
  })
}
