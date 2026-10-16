import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

/** error가 있으면 에러 메시지를, 없으면 hint를 aria-describedby로 연결한다. */
export function describedBy(id: string, { error, hint }: { error?: ReactNode; hint?: ReactNode }) {
  if (error) return `${id}-error`
  if (hint) return `${id}-hint`
  return undefined
}

export const controlClass = cn(
  'rounded-control h-10 w-full border border-gray-300 bg-white px-3 text-sm text-gray-900',
  'placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 focus:outline-none',
  'disabled:cursor-not-allowed disabled:bg-gray-50',
  'aria-invalid:border-danger-600 aria-invalid:focus:ring-danger-50',
)
