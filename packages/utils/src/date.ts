import { addDays, format, parseISO, startOfWeek } from 'date-fns'

/** 로컬 시간 기준 YYYY-MM-DD */
export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

/** 해당 날짜가 속한 주의 월요일(YYYY-MM-DD) */
export function weekStartOf(value: Date | string): string {
  const date = typeof value === 'string' ? parseISO(value) : value
  return toISODate(startOfWeek(date, { weekStartsOn: 1 }))
}

/** YYYY-MM-DD에 일 수를 더한다 */
export function addDaysISO(isoDate: string, days: number): string {
  return toISODate(addDays(parseISO(isoDate), days))
}

/** 2026-10-12 → "10월 12일 (월)" */
export function formatDayLabel(isoDate: string): string {
  const date = parseISO(isoDate)
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${weekday})`
}

/** 주 범위 표시: "10월 12일 ~ 10월 18일" */
export function formatWeekRange(weekStart: string): string {
  const start = parseISO(weekStart)
  const end = addDays(start, 6)
  return `${start.getMonth() + 1}월 ${start.getDate()}일 ~ ${end.getMonth() + 1}월 ${end.getDate()}일`
}
