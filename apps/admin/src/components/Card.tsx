import { cn } from '@lms/ui'
import type { ComponentProps } from 'react'

/** 회색 배경 위의 흰 면 카드. 테두리 없이 면과 여백으로 영역을 나눈다. */
export function Card({ className, ...props }: ComponentProps<'section'>) {
  return <section className={cn('rounded-card bg-white p-6', className)} {...props} />
}
