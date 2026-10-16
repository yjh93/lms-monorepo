import { cn } from '@lms/ui'

interface CheckboxGroupProps<T extends string> {
  legend: string
  options: readonly { value: T; label: string }[]
  value: readonly T[]
  onChange: (next: T[]) => void
  className?: string
}

/** 다중 선택 필터용 체크박스 그룹 (fieldset/legend로 그룹 이름을 노출) */
export function CheckboxGroup<T extends string>({
  legend,
  options,
  value,
  onChange,
  className,
}: CheckboxGroupProps<T>) {
  const toggle = (option: T, checked: boolean) => {
    onChange(
      checked
        ? options.map((o) => o.value).filter((v) => v === option || value.includes(v))
        : value.filter((v) => v !== option),
    )
  }

  return (
    <fieldset className={cn('flex flex-col gap-1.5', className)}>
      <legend className="mb-1.5 text-sm font-medium text-gray-800">{legend}</legend>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-1.5 text-sm text-gray-700">
            <input
              type="checkbox"
              className="accent-brand-600 size-4"
              checked={value.includes(option.value)}
              onChange={(event) => toggle(option.value, event.target.checked)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
