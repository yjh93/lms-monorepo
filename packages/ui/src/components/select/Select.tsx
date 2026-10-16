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
      <select
        id={selectId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(selectId, { error, hint })}
        className={cn(controlClass, 'pr-8', className)}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  )
}
