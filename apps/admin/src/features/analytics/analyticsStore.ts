import type { AttendanceStatus, Language } from '@lms/api-client'
import { create } from 'zustand'
import type { AnalyticsFilters, RangeKey, SortKey, SortState } from './engine/types'

/**
 * 분석 화면의 클라이언트 상태(필터·정렬·히트맵 셀 선택).
 * 공유·북마크가 핵심인 목록 화면은 URL을 상태 저장소로 쓰지만, 이 화면의 필터는
 * 탐색 중에 자주 바뀌는 일시적 상태라 Zustand에 둔다. 컴포넌트는 필요한 조각만 구독한다.
 */
interface AnalyticsState {
  filters: AnalyticsFilters
  sort: SortState
  setRange: (range: RangeKey) => void
  toggleCompany: (company: string) => void
  toggleStatus: (status: AttendanceStatus) => void
  setLanguage: (language: Language | '') => void
  toggleCell: (cell: { weekday: number; slot: number }) => void
  setQuery: (q: string) => void
  setSort: (key: SortKey) => void
  reset: () => void
}

export const initialFilters: AnalyticsFilters = {
  range: '90d',
  companies: [],
  statuses: [],
  language: '',
  cell: null,
  q: '',
}

const toggle = <T>(list: T[], value: T) =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value]

export const useAnalyticsStore = create<AnalyticsState>()((set) => ({
  filters: initialFilters,
  sort: { key: 'date', desc: true },
  setRange: (range) => set((s) => ({ filters: { ...s.filters, range } })),
  toggleCompany: (company) =>
    set((s) => ({ filters: { ...s.filters, companies: toggle(s.filters.companies, company) } })),
  toggleStatus: (status) =>
    set((s) => ({ filters: { ...s.filters, statuses: toggle(s.filters.statuses, status) } })),
  setLanguage: (language) => set((s) => ({ filters: { ...s.filters, language } })),
  toggleCell: (cell) =>
    set((s) => {
      const same = s.filters.cell?.weekday === cell.weekday && s.filters.cell.slot === cell.slot
      return { filters: { ...s.filters, cell: same ? null : cell } }
    }),
  setQuery: (q) => set((s) => ({ filters: { ...s.filters, q } })),
  setSort: (key) =>
    set((s) => ({
      // 같은 열을 다시 누르면 방향만 바꾸고, 다른 열은 기본 방향(날짜는 최신순)으로 시작
      sort: s.sort.key === key ? { key, desc: !s.sort.desc } : { key, desc: key === 'date' },
    })),
  reset: () => set({ filters: initialFilters, sort: { key: 'date', desc: true } }),
}))
