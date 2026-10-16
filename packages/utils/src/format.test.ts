import { describe, expect, it } from 'vitest'
import { formatDate, formatDateTime, formatKRW, formatPercent, formatPhone } from './format'

describe('formatDate / formatDateTime', () => {
  it('ISO 문자열을 포맷한다', () => {
    expect(formatDate('2026-10-16T05:30:00')).toBe('2026-10-16')
    expect(formatDateTime('2026-10-16T05:30:00')).toBe('2026-10-16 05:30')
  })

  it('잘못된 값은 fallback을 반환한다', () => {
    expect(formatDate('not-a-date')).toBe('-')
    expect(formatDate(null, '미정')).toBe('미정')
  })
})

describe('formatPhone', () => {
  it.each([
    ['01012345678', '010-1234-5678'],
    ['010-1234-5678', '010-1234-5678'],
    ['0212345678', '02-1234-5678'],
    ['0311234567', '031-123-4567'],
  ])('%s → %s', (input, expected) => {
    expect(formatPhone(input)).toBe(expected)
  })
})

describe('formatPercent / formatKRW', () => {
  it('비율을 퍼센트로, 불필요한 소수점 0은 제거한다', () => {
    expect(formatPercent(0.873)).toBe('87.3%')
    expect(formatPercent(1)).toBe('100%')
    expect(formatPercent(Number.NaN)).toBe('-')
  })

  it('원화 단위를 붙인다', () => {
    expect(formatKRW(450000)).toBe('450,000원')
  })
})
