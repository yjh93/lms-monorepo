import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export interface FieldProps {
  id: string
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  required?: boolean
  className?: string
  children: ReactNode
}

/** label / hint / error 메시지를 입력 컨트롤과 접근성 있게 연결하는 래퍼 */
export function Field({ id, label, hint, error, required, className, children }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && (
        <label htmlFor={id} className="text-[13px] font-semibold text-gray-700">
          {label}
          {required && (
            <span aria-hidden className="text-brand-500 ml-0.5">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-danger-500 text-[13px]">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[13px] text-gray-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
