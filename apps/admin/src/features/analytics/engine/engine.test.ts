import { generateDataset } from './dataset'
import { aggregate, filterIndices, sortIndices, toRow } from './engine'
import { createAnalyticsService } from './service'
import type { AnalyticsFilters } from './types'

const today = new Date(2026, 9, 30)
const ds = generateDataset(20_000, today)
const all: AnalyticsFilters = {
  range: '365d',
  companies: [],
  statuses: [],
  language: '',
  cell: null,
  q: '',
}

describe('analytics engine', () => {
  it('같은 시드면 같은 데이터셋을 만든다(재현 가능)', () => {
    const again = generateDataset(20_000, today)
    expect(again.status).toEqual(ds.status)
    expect(again.student).toEqual(ds.student)
  })

  it('기간 필터: 짧은 기간은 긴 기간의 부분집합', () => {
    const d30 = filterIndices(ds, { ...all, range: '30d' })
    const d365 = filterIndices(ds, all)
    expect(d365.length).toBe(ds.size)
    expect(d30.length).toBeGreaterThan(0)
    expect(d30.length).toBeLessThan(d365.length)
  })

  it('여러 조건을 함께 적용한다', () => {
    const filters: AnalyticsFilters = {
      ...all,
      companies: ['한빛전자', '누리물산'],
      statuses: ['ABSENT'],
      language: 'EN',
    }
    const indices = filterIndices(ds, filters)
    expect(indices.length).toBeGreaterThan(0)
    for (const i of indices.slice(0, 200)) {
      const row = toRow(ds, i)
      expect(['한빛전자', '누리물산']).toContain(row.company)
      expect(row.status).toBe('ABSENT')
    }
  })

  it('집계: 상태별 합계 = 일치 건수, 히트맵 합계 = 일치 건수', () => {
    const indices = filterIndices(ds, { ...all, range: '90d' })
    const result = aggregate(ds, indices)
    const statusSum = Object.values(result.counts).reduce((a, b) => a + b, 0)
    const heatSum = result.heatmap.reduce((a, c) => a + c.total, 0)
    expect(statusSum).toBe(result.matched)
    expect(heatSum).toBe(result.matched)
    expect(result.rate).toBeGreaterThan(0.6)
    expect(result.rate).toBeLessThan(1)
  })

  it('히트맵은 셀 교차 필터 이전 집합으로 계산된다', () => {
    const filters = { ...all, cell: { weekday: 2, slot: 4 } }
    const indices = filterIndices(ds, filters)
    const before = filterIndices(ds, all)
    const result = aggregate(ds, indices, before)
    expect(result.matched).toBe(indices.length)
    expect(result.heatmap.filter((c) => c.total > 0).length).toBeGreaterThan(1)
  })

  it('정렬: 날짜 내림차순, 학생 이름 오름차순', () => {
    const indices = filterIndices(ds, { ...all, range: '30d' })
    const byDate = Array.from(sortIndices(ds, indices, { key: 'date', desc: true }).slice(0, 50))
    const dates = byDate.map((i) => toRow(ds, i).date)
    expect(dates).toEqual([...dates].sort().reverse())

    const byName = Array.from(
      sortIndices(ds, indices, { key: 'student', desc: false }).slice(0, 50),
    )
    const names = byName.map((i) => toRow(ds, i).student)
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'ko')))
  })
})

describe('analytics service', () => {
  it('커서 기반 페이지: 중복 없이 이어지고 마지막에 nextCursor가 null', async () => {
    const service = createAnalyticsService(3_000, today)
    const sort = { key: 'date' as const, desc: true }
    const seen = new Set<number>()
    let cursor: number | null = 0
    while (cursor !== null) {
      const page = await service.rows(all, sort, cursor, 500)
      page.rows.forEach((row) => seen.add(row.index))
      cursor = page.nextCursor
    }
    expect(seen.size).toBe(3_000)
  })
})
