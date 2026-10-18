import { describe, expect, it } from 'vitest'
import { addDaysISO, formatDayLabel, formatWeekRange, weekStartOf } from './date'

describe('주 단위 날짜 유틸', () => {
  it('주의 시작은 월요일이다', () => {
    expect(weekStartOf('2026-10-18')).toBe('2026-10-12') // 일요일 → 그 주 월요일
    expect(weekStartOf('2026-10-12')).toBe('2026-10-12')
    expect(weekStartOf('2026-10-14')).toBe('2026-10-12')
  })

  it('월 경계를 넘어 날짜를 더한다', () => {
    expect(addDaysISO('2026-10-30', 3)).toBe('2026-11-02')
    expect(addDaysISO('2026-11-02', -7)).toBe('2026-10-26')
  })

  it('표시용 라벨을 만든다', () => {
    expect(formatDayLabel('2026-10-12')).toBe('10월 12일 (월)')
    expect(formatWeekRange('2026-10-26')).toBe('10월 26일 ~ 11월 1일')
  })
})
