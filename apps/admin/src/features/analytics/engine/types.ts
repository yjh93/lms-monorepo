import type { AttendanceStatus, Language } from '@lms/api-client'

/** 상태 코드 = 배열 인덱스 (Uint8Array에 저장) */
export const STATUS_BY_CODE = [
  'PRESENT',
  'LATE',
  'ABSENT',
  'EXCUSED',
] as const satisfies readonly AttendanceStatus[]

/** 시간대 슬롯: 08시 ~ 21시 (14칸). slot = 시작 시각 - 8 */
export const FIRST_HOUR = 8
export const SLOT_COUNT = 14

/** 요일: 0=월 ... 6=일 */
export const WEEKDAY_LABEL = ['월', '화', '수', '목', '금', '토', '일'] as const

export const RANGE_DAYS = { '30d': 30, '90d': 90, '180d': 180, '365d': 365 } as const
export type RangeKey = keyof typeof RANGE_DAYS

export interface AnalyticsFilters {
  range: RangeKey
  companies: string[]
  statuses: AttendanceStatus[]
  language: Language | ''
  /** 히트맵 셀 교차 필터 */
  cell: { weekday: number; slot: number } | null
  /** 수강생 이름 검색 */
  q: string
}

export type SortKey = 'date' | 'student' | 'company'
export interface SortState {
  key: SortKey
  desc: boolean
}

export interface AttendanceRow {
  index: number
  date: string
  time: string
  weekday: number
  student: string
  company: string
  teacher: string
  course: string
  status: AttendanceStatus
}

export interface HeatCell {
  weekday: number
  slot: number
  total: number
  /** 출석률 (출석+지각)/전체, 표본 0이면 null */
  rate: number | null
}

export interface Aggregate {
  /** 데이터셋 전체 레코드 수 */
  total: number
  /** 필터에 맞는 레코드 수 */
  matched: number
  rate: number
  counts: Record<AttendanceStatus, number>
  heatmap: HeatCell[]
  monthly: { month: string; present: number; late: number; absent: number; excused: number }[]
  byCompany: { company: string; total: number; rate: number }[]
  /** 워커에서 필터+집계에 걸린 시간 */
  elapsedMs: number
}

export interface RowsPage {
  rows: AttendanceRow[]
  nextCursor: number | null
  matched: number
  elapsedMs: number
}

export interface DatasetInfo {
  size: number
  companies: string[]
  generatedMs: number
  bytes: number
}

/** 워커/인라인 구현이 공유하는 클라이언트 인터페이스 */
export interface AnalyticsClient {
  info(): Promise<DatasetInfo>
  aggregate(filters: AnalyticsFilters): Promise<Aggregate>
  rows(filters: AnalyticsFilters, sort: SortState, cursor: number, limit: number): Promise<RowsPage>
}
