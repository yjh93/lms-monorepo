import { useCompanies } from '@lms/api-client/query'
import { Button, Input, Select } from '@lms/ui'
import { useState } from 'react'
import { CheckboxGroup } from '../../components/CheckboxGroup'
import { levelOptions, statusOptions } from './studentDisplay'
import { useDebouncedCallback } from './useDebouncedCallback'
import type { useStudentListParams } from './useStudentListParams'

type ListParams = ReturnType<typeof useStudentListParams>

interface StudentFiltersProps {
  query: ListParams['query']
  setQuery: ListParams['setQuery']
  resetFilters: ListParams['resetFilters']
  activeFilterCount: number
}

export function StudentFilters({
  query,
  setQuery,
  resetFilters,
  activeFilterCount,
}: StudentFiltersProps) {
  const companies = useCompanies()

  // 검색어는 입력 즉시 화면에 반영하고, URL(=서버 요청)은 300ms 디바운스.
  // 뒤로가기·초기화로 URL이 바뀌면 입력값도 맞춘다(렌더 중 상태 조정 패턴).
  const [keyword, setKeyword] = useState(query.q)
  const [syncedQ, setSyncedQ] = useState(query.q)
  if (syncedQ !== query.q) {
    setSyncedQ(query.q)
    setKeyword(query.q)
  }
  const commitKeyword = useDebouncedCallback((q: string) => setQuery({ q }, { replace: true }), 300)

  return (
    <section
      aria-label="수강생 검색 필터"
      className="mb-4 grid gap-4 rounded-xl border border-gray-200 bg-white p-4 lg:grid-cols-[1fr_1fr_14rem]"
    >
      <Input
        label="검색"
        type="search"
        placeholder="이름, 이메일, 전화번호, 부서"
        value={keyword}
        onChange={(event) => {
          setKeyword(event.target.value)
          commitKeyword(event.target.value)
        }}
        className="lg:col-span-2"
      />
      <Select
        label="고객사"
        placeholder="전체"
        value={query.company}
        onChange={(event) => setQuery({ company: event.target.value })}
        options={(companies.data ?? []).map((company) => ({ value: company, label: company }))}
      />
      <CheckboxGroup
        legend="수강 상태"
        options={statusOptions}
        value={query.status}
        onChange={(status) => setQuery({ status })}
      />
      <CheckboxGroup
        legend="레벨"
        options={levelOptions}
        value={query.level}
        onChange={(level) => setQuery({ level })}
      />
      <div className="flex items-end justify-end">
        <Button variant="ghost" onClick={resetFilters} disabled={activeFilterCount === 0}>
          필터 초기화{activeFilterCount > 0 && ` (${activeFilterCount})`}
        </Button>
      </div>
    </section>
  )
}
