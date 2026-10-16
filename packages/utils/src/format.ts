import { format, isValid, parseISO } from 'date-fns'

type DateInput = string | number | Date | null | undefined

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === '') return null
  const date = typeof value === 'string' ? parseISO(value) : new Date(value)
  return isValid(date) ? date : null
}

/** 2026-10-16 */
export function formatDate(value: DateInput, fallback = '-'): string {
  const date = toDate(value)
  return date ? format(date, 'yyyy-MM-dd') : fallback
}

/** 2026-10-16 14:30 */
export function formatDateTime(value: DateInput, fallback = '-'): string {
  const date = toDate(value)
  return date ? format(date, 'yyyy-MM-dd HH:mm') : fallback
}

/** 01012345678 → 010-1234-5678 */
export function formatPhone(value: string | null | undefined, fallback = '-'): string {
  if (!value) return fallback
  const digits = value.replace(/\D/g, '')
  if (digits.length === 11) return digits.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
  if (digits.length === 10) {
    return digits.startsWith('02')
      ? digits.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3')
      : digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
  }
  return value
}

/** 0.873 → 87.3% (ratio 기준). digits 기본값 1 */
export function formatPercent(
  ratio: number | null | undefined,
  digits = 1,
  fallback = '-',
): string {
  if (ratio === null || ratio === undefined || Number.isNaN(ratio)) return fallback
  return `${(ratio * 100).toFixed(digits).replace(/\.0+$/, '')}%`
}

/** 1234567 → 1,234,567 */
export function formatNumber(value: number | null | undefined, fallback = '-'): string {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback
  return new Intl.NumberFormat('ko-KR').format(value)
}

/** 원화 표기: 450000 → 450,000원 */
export function formatKRW(value: number | null | undefined, fallback = '-'): string {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback
  return `${formatNumber(value)}원`
}
