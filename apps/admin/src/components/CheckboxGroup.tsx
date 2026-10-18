import { cn } from '@lms/ui'

interface CheckboxGroupProps<T extends string> {
  legend: string
  options: readonly { value: T; label: string }[]
  value: readonly T[]
  onChange: (next: T[]) => void
  className?: string
}

/**
 * 다중 선택 필터를 칩 형태로 보여준다.
 * 실제 컨트롤은 네이티브 체크박스(시각적으로만 숨김)라 키보드·스크린리더 동작은 그대로다.
 */
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
    <fieldset className={cn('flex flex-col gap-2', className)}>
      <legend className="mb-2 text-[13px] font-semibold text-gray-700">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.value} className="cursor-pointer">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={value.includes(option.value)}
              onChange={(event) => toggle(option.value, event.target.checked)}
            />
            <span
              className={cn(
                'inline-flex h-9 items-center rounded-full px-3.5 text-[14px] font-medium transition-colors',
                'bg-gray-100 text-gray-600 hover:bg-gray-200',
                'peer-checked:bg-gray-800 peer-checked:text-white',
                'peer-focus-visible:ring-brand-500 peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2',
              )}
            >
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
