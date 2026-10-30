import type { AttendanceStatus } from '@lms/api-client'
import { dayToISO, slotLabel, type Dataset } from './dataset'
import {
  FIRST_HOUR,
  RANGE_DAYS,
  SLOT_COUNT,
  STATUS_BY_CODE,
  type Aggregate,
  type AnalyticsFilters,
  type AttendanceRow,
  type HeatCell,
  type SortState,
} from './types'

/**
 * 필터 → 일치하는 레코드 인덱스 목록.
 * 문자열 비교는 루프 밖에서 "코드 집합"으로 바꿔 두고, 30만 건 루프 안에서는 정수 비교만 한다.
 */
export function filterIndices(ds: Dataset, filters: AnalyticsFilters): Uint32Array {
  const fromDay = ds.today - RANGE_DAYS[filters.range]
  const companyCodes = new Set(filters.companies.map((name) => ds.companies.indexOf(name)))
  const statusCodes = new Set(
    filters.statuses.map((status) =>
      STATUS_BY_CODE.indexOf(status as (typeof STATUS_BY_CODE)[number]),
    ),
  )
  const courseAllowed = ds.courses.map(
    (course) => !filters.language || course.language === filters.language,
  )
  const keyword = filters.q.trim()
  const studentAllowed = keyword
    ? Uint8Array.from(ds.students, (name) => (name.includes(keyword) ? 1 : 0))
    : null
  const cell = filters.cell

  const out = new Uint32Array(ds.size)
  let count = 0
  for (let i = 0; i < ds.size; i++) {
    if (ds.day[i]! < fromDay) continue
    if (companyCodes.size > 0 && !companyCodes.has(ds.company[i]!)) continue
    if (statusCodes.size > 0 && !statusCodes.has(ds.status[i]!)) continue
    if (!courseAllowed[ds.course[i]!]) continue
    if (studentAllowed && !studentAllowed[ds.student[i]!]) continue
    if (cell && (ds.weekday[i] !== cell.weekday || ds.slot[i] !== cell.slot)) continue
    out[count++] = i
  }
  return out.slice(0, count)
}

const rate = (present: number, late: number, total: number) =>
  total === 0 ? 0 : (present + late) / total

/** 일치 레코드에 대한 KPI·히트맵·월별·고객사별 집계 (단일 패스) */
export function aggregate(
  ds: Dataset,
  indices: Uint32Array,
  heatmapIndices: Uint32Array = indices,
): Omit<Aggregate, 'elapsedMs'> {
  const counts = [0, 0, 0, 0]
  const monthKeys = new Map<string, number[]>()
  const companyStats = ds.companies.map(() => [0, 0, 0]) // total, present, late
  // 레코드마다 Date를 만들면 30만 번 할당이 생긴다. 날짜(일 수) → 월 버킷을 한 번만 계산해 재사용한다.
  const bucketByDay = new Map<number, number[]>()

  for (let k = 0; k < indices.length; k++) {
    const i = indices[k]!
    const status = ds.status[i]!
    counts[status]!++
    const day = ds.day[i]!
    let bucket = bucketByDay.get(day)
    if (!bucket) {
      const month = dayToISO(day).slice(0, 7)
      bucket = monthKeys.get(month)
      if (!bucket) monthKeys.set(month, (bucket = [0, 0, 0, 0]))
      bucketByDay.set(day, bucket)
    }
    bucket[status]!++
    const company = companyStats[ds.company[i]!]!
    company[0]!++
    if (status === 0) company[1]!++
    if (status === 1) company[2]!++
  }

  // 히트맵은 셀 교차 필터를 적용하기 "전" 집합으로 계산해야 다른 셀을 다시 고를 수 있다.
  const heat = Array.from({ length: 7 * SLOT_COUNT }, () => [0, 0])
  for (let k = 0; k < heatmapIndices.length; k++) {
    const i = heatmapIndices[k]!
    const cell = heat[ds.weekday[i]! * SLOT_COUNT + ds.slot[i]!]!
    cell[0]!++
    if (ds.status[i]! <= 1) cell[1]!++
  }
  const heatmap: HeatCell[] = heat.map(([total, attended], index) => ({
    weekday: Math.floor(index / SLOT_COUNT),
    slot: index % SLOT_COUNT,
    total: total!,
    rate: total ? attended! / total! : null,
  }))

  const statusCounts = Object.fromEntries(
    STATUS_BY_CODE.map((status, code) => [status, counts[code]!]),
  ) as Record<AttendanceStatus, number>

  return {
    total: ds.size,
    matched: indices.length,
    rate: rate(counts[0]!, counts[1]!, indices.length),
    counts: statusCounts,
    heatmap,
    monthly: [...monthKeys.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, [present, late, absent, excused]]) => ({
        month,
        present: present!,
        late: late!,
        absent: absent!,
        excused: excused!,
      })),
    byCompany: companyStats
      .map(([total, present, late], code) => ({
        company: ds.companies[code]!,
        total: total!,
        rate: rate(present!, late!, total!),
      }))
      .filter((c) => c.total > 0)
      .sort((a, b) => b.rate - a.rate),
  }
}

/** 정렬용 순위 테이블: 이름 문자열 비교를 레코드마다 하지 않도록 미리 순위로 바꾼다. */
function rankOf(names: string[]) {
  const order = names.map((_, i) => i).sort((a, b) => names[a]!.localeCompare(names[b]!, 'ko'))
  const rank = new Uint32Array(names.length)
  order.forEach((index, position) => (rank[index] = position))
  return rank
}

const rankCache = new WeakMap<Dataset, { student: Uint32Array; company: Uint32Array }>()

export function sortIndices(ds: Dataset, indices: Uint32Array, sort: SortState): Uint32Array {
  let ranks = rankCache.get(ds)
  if (!ranks)
    rankCache.set(ds, (ranks = { student: rankOf(ds.students), company: rankOf(ds.companies) }))
  const { student, company } = ranks

  const time = (i: number) => ds.day[i]! * 1440 + (FIRST_HOUR + ds.slot[i]!) * 60 + ds.minute[i]!
  const primary =
    sort.key === 'student'
      ? (i: number) => student[ds.student[i]!]!
      : sort.key === 'company'
        ? (i: number) => company[ds.company[i]!]!
        : time
  const sign = sort.desc ? -1 : 1

  // TypedArray#sort는 숫자 비교에 최적화되어 있다. 동순위는 최신순으로 고정해 결과를 안정적으로 만든다.
  return indices.slice().sort((a, b) => sign * (primary(a) - primary(b)) || time(b) - time(a))
}

export function toRow(ds: Dataset, i: number): AttendanceRow {
  const course = ds.courses[ds.course[i]!]!
  return {
    index: i,
    date: dayToISO(ds.day[i]!),
    time: `${slotLabel(ds.slot[i]!).slice(0, 2)}:${String(ds.minute[i]!).padStart(2, '0')}`,
    weekday: ds.weekday[i]!,
    student: ds.students[ds.student[i]!]!,
    company: ds.companies[ds.company[i]!]!,
    teacher: ds.teachers[ds.teacher[i]!]!,
    course: course.title,
    status: STATUS_BY_CODE[ds.status[i]!]!,
  }
}
