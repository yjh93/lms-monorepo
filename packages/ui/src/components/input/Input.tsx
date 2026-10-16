'use client'

import { useId, type ComponentProps, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Field } from '../field/Field'
import { controlClass, describedBy } from '../field/fieldStyles'

export interface InputProps extends Omit<ComponentProps<'input'>, 'size'> {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
}

export function Input({ id, label, hint, error, required, className, ...props }: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <Field id={inputId} label={label} hint={hint} error={error} required={required}>
      <input
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(inputId, { error, hint })}
        className={cn(controlClass, className)}
        {...props}
      />
    </Field>
  )
}
