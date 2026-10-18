import {
  AUDIT_ACTION_LABEL,
  AUDIT_ACTIONS,
  parseAuditLogQuery,
  toAuditLogSearchParams,
  type AuditAction,
  type AuditLog,
  type AuditLogQuery,
} from '@lms/api-client'
import { useAuditLogs } from '@lms/api-client/query'
import { Badge, createDataTableColumnHelper, DataTable, Input, type BadgeTone } from '@lms/ui'
import { formatDateTime, ROLE_LABEL, ROLES } from '@lms/utils'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { CheckboxGroup } from '../../components/CheckboxGroup'
import { PageHeader } from '../../components/PageHeader'
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback'

const ACTION_TONE: Record<AuditAction, BadgeTone> = {
  STUDENT_CREATED: 'success',
  STUDENT_UPDATED: 'brand',
  STUDENT_IMPORTED: 'warning',
  ATTENDANCE_CHANGED: 'neutral',
}

const actionOptions = AUDIT_ACTIONS.map((value) => ({ value, label: AUDIT_ACTION_LABEL[value] }))
const roleOptions = ROLES.map((value) => ({ value, label: ROLE_LABEL[value] }))

const column = createDataTableColumnHelper<AuditLog>()
const columns = [
  column.accessor('at', {
    header: '일시',
    cell: (info) => formatDateTime(info.getValue()),
    meta: { className: 'whitespace-nowrap' },
  }),
  column.accessor('actor', {
    header: '작업자',
    cell: (info) => (
      <span className="whitespace-nowrap">
        {info.getValue().name}
        <span className="ml-1 text-xs text-gray-500">{ROLE_LABEL[info.getValue().role]}</span>
      </span>
    ),
  }),
  column.accessor('action', {
    header: '작업',
    cell: (info) => (
      <Badge tone={ACTION_TONE[info.getValue()]}>{AUDIT_ACTION_LABEL[info.getValue()]}</Badge>
    ),
  }),
  column.accessor('summary', {
    header: '내용',
    cell: (info) => {
      const { changes } = info.row.original
      return (
        <div>
          <p>{info.getValue()}</p>
          {changes.length > 0 && (
            <ul className="mt-1 space-y-0.5 text-xs text-gray-500">
              {changes.map((change) => (
                <li key={change.field}>
                  {change.label}: <del className="text-gray-400">{change.from}</del> →{' '}
                  <span className="font-medium text-gray-700">{change.to}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )
    },
  }),
]

export function AuditLogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = parseAuditLogQuery(searchParams)
  const { data, isPending, isFetching } = useAuditLogs(query)

  const setQuery = (patch: Partial<AuditLogQuery>, options: { replace?: boolean } = {}) =>
    setSearchParams(
      (previous) =>
        toAuditLogSearchParams({
          ...parseAuditLogQuery(previous),
          ...patch,
          ...(!('page' in patch) && { page: 1 }),
        }),
      options,
    )

  const [keyword, setKeyword] = useState(query.q)
  const commitKeyword = useDebouncedCallback((q: string) => setQuery({ q }, { replace: true }), 300)

  return (
    <>
      <PageHeader
        title="변경 이력"
        description="누가, 언제, 무엇을 바꿨는지 기록합니다. 관리자만 조회할 수 있습니다."
      />

      <section
        aria-label="변경 이력 필터"
        className="mb-4 grid gap-4 rounded-xl border border-gray-200 bg-white p-4 lg:grid-cols-3"
      >
        <Input
          label="검색"
          type="search"
          placeholder="작업자, 대상, 내용"
          value={keyword}
          onChange={(event) => {
            setKeyword(event.target.value)
            commitKeyword(event.target.value)
          }}
        />
        <CheckboxGroup
          legend="작업"
          options={actionOptions}
          value={query.action}
          onChange={(action) => setQuery({ action })}
        />
        <CheckboxGroup
          legend="작업자 역할"
          options={roleOptions}
          value={query.role}
          onChange={(role) => setQuery({ role })}
        />
      </section>

      <DataTable
        caption="변경 이력"
        data={data?.items ?? []}
        columns={columns}
        getRowId={(log) => log.id}
        rowCount={data?.total}
        pagination={{ pageIndex: query.page - 1, pageSize: query.pageSize }}
        onPaginationChange={(updater) => {
          const current = { pageIndex: query.page - 1, pageSize: query.pageSize }
          const next = typeof updater === 'function' ? updater(current) : updater
          setQuery({ page: next.pageIndex + 1 })
        }}
        isLoading={isPending || isFetching}
        emptyMessage="기록된 변경 이력이 없습니다. 수강생을 등록·수정하거나 출석을 바꿔 보세요."
      />
    </>
  )
}
