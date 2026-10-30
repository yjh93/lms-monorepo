import { datasetBytes, generateDataset, type Dataset } from './dataset'
import { aggregate, filterIndices, sortIndices, toRow } from './engine'
import type {
  Aggregate,
  AnalyticsClient,
  AnalyticsFilters,
  DatasetInfo,
  RowsPage,
  SortState,
} from './types'

export const ANALYTICS_DATASET_SIZE = 300_000

/**
 * 데이터셋 위에서 동작하는 분석 서비스. 워커 안에서 실행되는 것이 기본이고,
 * 테스트(jsdom)에서는 같은 서비스를 메인 스레드에서 직접 쓴다.
 * 같은 필터·정렬이 반복되면(무한 스크롤 다음 페이지 등) 이전 결과를 재사용한다.
 */
export function createAnalyticsService(
  size = ANALYTICS_DATASET_SIZE,
  today = new Date(),
): AnalyticsClient {
  const started = performance.now()
  const ds: Dataset = generateDataset(size, today)
  const info: DatasetInfo = {
    size: ds.size,
    companies: [...ds.companies].sort((a, b) => a.localeCompare(b, 'ko')),
    generatedMs: Math.round(performance.now() - started),
    bytes: datasetBytes(ds),
  }

  const filterCache = new Map<string, Uint32Array>()
  const remember = (key: string, compute: () => Uint32Array) => {
    let value = filterCache.get(key)
    if (!value) {
      value = compute()
      filterCache.set(key, value)
      // 최근 8개 필터 결과만 보관한다(오래된 것부터 제거).
      if (filterCache.size > 8) filterCache.delete(filterCache.keys().next().value!)
    }
    return value
  }
  const matched = (filters: AnalyticsFilters) =>
    remember(JSON.stringify(filters), () => filterIndices(ds, filters))

  let sortedKey = ''
  let sorted: Uint32Array = new Uint32Array()

  return {
    async info() {
      return info
    },

    async aggregate(filters): Promise<Aggregate> {
      const start = performance.now()
      const indices = matched(filters)
      const heatmapIndices = filters.cell ? matched({ ...filters, cell: null }) : indices
      const result = aggregate(ds, indices, heatmapIndices)
      return { ...result, elapsedMs: Math.round((performance.now() - start) * 10) / 10 }
    },

    async rows(filters, sort: SortState, cursor, limit): Promise<RowsPage> {
      const start = performance.now()
      const key = JSON.stringify([filters, sort])
      if (key !== sortedKey) {
        sorted = sortIndices(ds, matched(filters), sort)
        sortedKey = key
      }
      const end = Math.min(cursor + limit, sorted.length)
      const rows = []
      for (let k = cursor; k < end; k++) rows.push(toRow(ds, sorted[k]!))
      return {
        rows,
        nextCursor: end < sorted.length ? end : null,
        matched: sorted.length,
        elapsedMs: Math.round((performance.now() - start) * 10) / 10,
      }
    },
  }
}
