import type { ComponentProps } from 'react'
import { cn } from '../../lib/cn'

const variants = {
  primary:
    'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 focus-visible:outline-brand-500',
  /** 같은 계열의 옅은 면 버튼: 보조 액션 */
  secondary:
    'bg-brand-50 text-brand-600 hover:bg-brand-100 active:bg-brand-100 focus-visible:outline-brand-500',
  /** 회색 면 버튼: 취소/중립 액션 */
  neutral:
    'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-200 focus-visible:outline-gray-400',
  /** 회색 배경(페이지) 위에 올리는 흰 면 버튼 */
  surface:
    'bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 focus-visible:outline-gray-400',
  ghost: 'text-gray-600 hover:bg-gray-100 active:bg-gray-200 focus-visible:outline-gray-400',
  danger:
    'bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700 focus-visible:outline-danger-500',
} as const

const sizes = {
  sm: 'h-9 rounded-[10px] px-3 text-[13px]',
  md: 'h-11 rounded-control px-4 text-[15px]',
  lg: 'h-14 rounded-2xl px-6 text-[17px]',
} as const

export type ButtonVariant = keyof typeof variants
export type ButtonSize = keyof typeof sizes

// React 19: ref가 일반 prop이 되어 forwardRef 없이 ComponentProps<'button'>에 포함된다.
export interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  type = 'button',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 font-semibold whitespace-nowrap',
        'transition-[background-color,transform] duration-150 active:scale-[0.98]',
        'focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-40',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <span
          aria-hidden
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  )
}
