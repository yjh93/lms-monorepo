import { PAGE_SIZES } from '@lms/api-client'
import { useStudents } from '@lms/api-client/query'
import { Button, DataTable, Select } from '@lms/ui'
import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { Can } from '../../auth/Can'
import { usePermission } from '../../auth/usePermission'
import { PageHeader } from '../../components/PageHeader'
import { getStudentColumns } from './studentColumns'
import { StudentFilters } from './StudentFilters'
import { useStudentListParams } from './useStudentListParams'

const pageSizeOptions = PAGE_SIZES.map((size) => ({ value: String(size), label: `${size}개씩` }))

export function StudentListPage() {
  const navigate = useNavigate()
  const params = useStudentListParams()
  const canEdit = usePermission('student:update')
  const columns = useMemo(() => getStudentColumns({ canEdit }), [canEdit])
  const { data, isPending, isFetching, isError, error, refetch } = useStudents(params.query)

  return (
    <>
      <PageHeader
        title="수강생"
        description="고객사별 수강생을 조회하고 관리합니다."
        actions={
          <>
            <Can permission="student:import">
              <Button variant="secondary" onClick={() => navigate('/students/import')}>
                CSV 일괄 등록
              </Button>
            </Can>
            <Can permission="student:create">
              <Button onClick={() => navigate('/students/new')}>수강생 등록</Button>
            </Can>
          </>
        }
      />

      <StudentFilters
        query={params.query}
        setQuery={params.setQuery}
        resetFilters={params.resetFilters}
        activeFilterCount={params.activeFilterCount}
      />

      <div className="mb-2 flex items-center justify-end">
        <Select
          aria-label="페이지당 행 수"
          className="h-8 w-28"
          value={String(params.query.pageSize)}
          onChange={(event) =>
            params.onPaginationChange({ pageIndex: 0, pageSize: Number(event.target.value) })
          }
          options={pageSizeOptions}
        />
      </div>

      {isError ? (
        <div role="alert" className="border-danger-50 rounded-xl border bg-white p-8 text-center">
          <p className="text-danger-700 text-sm">{error.message}</p>
          <Button variant="secondary" className="mt-4" onClick={() => refetch()}>
            다시 시도
          </Button>
        </div>
      ) : (
        <DataTable
          caption="수강생 목록"
          data={data?.items ?? []}
          columns={columns}
          getRowId={(student) => student.id}
          rowCount={data?.total}
          sorting={params.sorting}
          onSortingChange={params.onSortingChange}
          pagination={params.pagination}
          onPaginationChange={params.onPaginationChange}
          // keepPreviousData로 이전 페이지를 보여주는 동안 흐리게 표시
          isLoading={isPending || isFetching}
          emptyMessage="조건에 맞는 수강생이 없습니다."
        />
      )}
    </>
  )
}
