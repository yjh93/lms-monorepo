import type { Meta, StoryObj } from '@storybook/react-vite'
import type { PaginationState, SortingState } from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { Badge, type BadgeTone } from '../badge/Badge'
import { DataTable } from './DataTable'
import { createDataTableColumnHelper } from './features'

type Status = 'ACTIVE' | 'PAUSED' | 'COMPLETED'

interface StudentRow {
  id: string
  name: string
  company: string
  level: string
  attendanceRate: number
  status: Status
}

const statusLabel: Record<Status, [string, BadgeTone]> = {
  ACTIVE: ['수강중', 'success'],
  PAUSED: ['휴강', 'warning'],
  COMPLETED: ['수료', 'brand'],
}

const names = ['김하나', '이두리', '박세나', '최네오', '정다섯', '강여섯', '조일곱', '윤여덟']
const companies = ['캐럿글로벌', '한빛전자', '누리물산', '푸른제약']
const statuses: Status[] = ['ACTIVE', 'PAUSED', 'COMPLETED']

const allRows: StudentRow[] = Array.from({ length: 37 }, (_, i) => ({
  id: `s${i + 1}`,
  name: names[i % names.length]!,
  company: companies[i % companies.length]!,
  level: `Lv.${(i % 6) + 1}`,
  attendanceRate: 60 + ((i * 7) % 41),
  status: statuses[i % statuses.length]!,
}))

const column = createDataTableColumnHelper<StudentRow>()
const columns = [
  column.accessor('name', { header: '이름' }),
  column.accessor('company', { header: '고객사' }),
  column.accessor('level', { header: '레벨', enableSorting: false }),
  column.accessor('attendanceRate', {
    header: '출석률',
    cell: (info) => `${info.getValue()}%`,
    meta: { align: 'right' },
  }),
  column.accessor('status', {
    header: '상태',
    enableSorting: false,
    cell: (info) => {
      const [label, tone] = statusLabel[info.getValue()]
      return <Badge tone={tone}>{label}</Badge>
    },
  }),
]

const meta = {
  title: 'Components/DataTable',
  component: DataTable<StudentRow>,
  args: { data: allRows.slice(0, 5), columns, caption: '수강생 목록' },
} satisfies Meta<typeof DataTable<StudentRow>>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {}

export const Empty: Story = { args: { data: [], emptyMessage: '조건에 맞는 수강생이 없습니다.' } }

export const Loading: Story = { args: { data: [], isLoading: true } }

/** 서버 정렬/페이지네이션을 흉내 낸 예시: 상태는 controlled로 바깥에서 관리한다. */
export const ServerSide: Story = {
  render: function Render(args) {
    const [sorting, setSorting] = useState<SortingState>([])
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

    const page = useMemo(() => {
      const sorted = [...allRows]
      const rule = sorting[0]
      if (rule) {
        const key = rule.id as keyof StudentRow
        sorted.sort((a, b) => {
          const result = String(a[key]).localeCompare(String(b[key]), 'ko', { numeric: true })
          return rule.desc ? -result : result
        })
      }
      const start = pagination.pageIndex * pagination.pageSize
      return sorted.slice(start, start + pagination.pageSize)
    }, [sorting, pagination])

    return (
      <DataTable
        {...args}
        data={page}
        getRowId={(row) => row.id}
        sorting={sorting}
        onSortingChange={setSorting}
        pagination={pagination}
        onPaginationChange={setPagination}
        rowCount={allRows.length}
      />
    )
  },
}
