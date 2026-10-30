import {
  ATTENDANCE_STATUS_LABEL,
  ATTENDANCE_STATUSES,
  LANGUAGE_LABEL,
  LANGUAGES,
  type Language,
} from '@lms/api-client'
import { Button, cn, Input, Select } from '@lms/ui'
import { useState } from 'react'
import { CheckboxGroup } from '../../components/CheckboxGroup'
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback'
import { useAnalyticsStore } from './analyticsStore'
import { RANGE_DAYS, type RangeKey } from './engine/types'

const RANGE_LABEL: Record<RangeKey, string> = {
  '30d': '30일',
  '90d': '90일',
  '180d': '180일',
  '365d': '1년',
}

const statusOptions = ATTENDANCE_STATUSES.map((value) => ({
  value,
  label: ATTENDANCE_STATUS_LABEL[value],
}))

export function AnalyticsFilterBar({ companies }: { companies: string[] }) {
  const filters = useAnalyticsStore((s) => s.filters)
  const { setRange, toggleCompany, toggleStatus, setLanguage, setQuery, reset } =
    useAnalyticsStore.getState()

  const [keyword, setKeyword] = useState(filters.q)
  const commitKeyword = useDebouncedCallback(setQuery, 250)

  return (
    <section aria-label="분석 필터" className="rounded-card mb-4 flex flex-col gap-5 bg-white p-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-gray-700">기간</span>
          <div role="radiogroup" aria-label="기간" className="flex rounded-xl bg-gray-100 p-1">
            {(Object.keys(RANGE_DAYS) as RangeKey[]).map((range) => (
              <button
                key={range}
                type="button"
                role="radio"
                aria-checked={filters.range === range}
                onClick={() => setRange(range)}
                className={cn(
                  'h-9 min-w-14 rounded-[10px] px-3 text-[14px] font-semibold transition-colors',
                  filters.range === range
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700',
                )}
              >
                {RANGE_LABEL[range]}
              </button>
            ))}
          </div>
        </div>
        <Select
          label="언어"
          placeholder="전체"
          className="w-36"
          value={filters.language}
          onChange={(event) => setLanguage(event.target.value as Language | '')}
          options={LANGUAGES.map((value) => ({ value, label: LANGUAGE_LABEL[value] }))}
        />
        <div className="min-w-56 flex-1">
          <Input
            label="수강생 검색"
            type="search"
            placeholder="이름"
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value)
              commitKeyword(event.target.value)
            }}
          />
        </div>
        <Button
          variant="neutral"
          size="sm"
          onClick={() => {
            setKeyword('')
            reset()
          }}
        >
          초기화
        </Button>
      </div>
      <div className="flex flex-wrap gap-x-10 gap-y-5">
        <CheckboxGroup
          legend="출석 상태"
          options={statusOptions}
          value={filters.statuses}
          onChange={(next) => {
            const changed = [...next, ...filters.statuses].find(
              (s) => next.includes(s) !== filters.statuses.includes(s),
            )
            if (changed) toggleStatus(changed)
          }}
        />
        <CheckboxGroup
          legend="고객사"
          options={companies.map((value) => ({ value, label: value }))}
          value={filters.companies}
          onChange={(next) => {
            const changed = [...next, ...filters.companies].find(
              (c) => next.includes(c) !== filters.companies.includes(c),
            )
            if (changed) toggleCompany(changed)
          }}
        />
      </div>
    </section>
  )
}
