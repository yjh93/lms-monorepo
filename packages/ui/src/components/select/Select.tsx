'use client'

import { useId, type ComponentProps, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Field } from '../field/Field'
import { controlClass, describedBy } from '../field/fieldStyles'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends Omit<ComponentProps<'select'>, 'children'> {
  options: readonly SelectOption[]
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  /** 첫 번째 빈 옵션 문구. 지정하면 value=""인 옵션이 추가된다. */
  placeholder?: string
}

export function Select({
  id,
  options,
  label,
  hint,
  error,
  placeholder,
  required,
  className,
  ...props
}: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId

  return (
    <Field id={selectId} label={label} hint={hint} error={error} required={required}>
      <div className="relative">
        <select
          id={selectId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(selectId, { error, hint })}
          className={cn(controlClass, 'cursor-pointer appearance-none pr-10', className)}
          {...props}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-gray-500"
        >
          <path
            d="M5 7.5l5 5 5-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </Field>
  )
}
