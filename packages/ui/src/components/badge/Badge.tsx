import type { ComponentProps } from 'react'
import { cn } from '../../lib/cn'

const tones = {
  neutral: 'bg-gray-100 text-gray-600',
  brand: 'bg-brand-50 text-brand-600',
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-700',
  danger: 'bg-danger-50 text-danger-600',
} as const

export type BadgeTone = keyof typeof tones

export interface BadgeProps extends ComponentProps<'span'> {
  tone?: BadgeTone
}

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center rounded-md px-2 text-xs font-semibold whitespace-nowrap',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
