import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

/** error가 있으면 에러 메시지를, 없으면 hint를 aria-describedby로 연결한다. */
export function describedBy(id: string, { error, hint }: { error?: ReactNode; hint?: ReactNode }) {
  if (error) return `${id}-error`
  if (hint) return `${id}-hint`
  return undefined
}

/** 테두리 대신 회색 면으로 채운 입력 컨트롤. 포커스 시 흰 면 + 브랜드 링. */
export const controlClass = cn(
  'h-12 w-full rounded-control border-0 bg-gray-100 px-4 text-[15px] text-gray-900',
  'placeholder:text-gray-400 transition-[background-color,box-shadow] duration-150',
  'hover:bg-gray-200/70 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none',
  'disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-gray-100',
  'aria-invalid:bg-danger-50 aria-invalid:focus:ring-danger-500',
)
