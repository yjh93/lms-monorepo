import type { ComponentProps } from 'react'
import { cn } from '../../lib/cn'

const tones = {
  neutral: 'bg-gray-100 text-gray-700 ring-gray-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  success: 'bg-success-50 text-success-700 ring-success-700/20',
  warning: 'bg-warning-50 text-warning-700 ring-warning-700/20',
  danger: 'bg-danger-50 text-danger-700 ring-danger-700/20',
} as const

export type BadgeTone = keyof typeof tones

export interface BadgeProps extends ComponentProps<'span'> {
  tone?: BadgeTone
}

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
