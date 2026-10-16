import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataTable } from './DataTable'
import { createDataTableColumnHelper } from './features'

interface Student {
  id: string
  name: string
  company: string
}

const column = createDataTableColumnHelper<Student>()
const columns = [
  column.accessor('name', { header: '이름' }),
  column.accessor('company', { header: '고객사', enableSorting: false }),
]
const data: Student[] = [
  { id: 's1', name: '김하나', company: '캐럿' },
  { id: 's2', name: '이두리', company: '로이터' },
]

describe('DataTable', () => {
  it('헤더와 행을 렌더링한다', () => {
    render(<DataTable data={data} columns={columns} getRowId={(row) => row.id} />)

    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(3)
    expect(within(rows[1]!).getByText('김하나')).toBeInTheDocument()
  })

  it('데이터가 없으면 emptyMessage를 보여준다', () => {
    render(<DataTable data={[]} columns={columns} emptyMessage="수강생이 없습니다." />)
    expect(screen.getByText('수강생이 없습니다.')).toBeInTheDocument()
  })

  it('정렬 가능한 헤더 클릭 시 onSortingChange로 다음 정렬 상태를 전달한다', async () => {
    const onSortingChange = vi.fn()
    render(
      <DataTable data={data} columns={columns} sorting={[]} onSortingChange={onSortingChange} />,
    )

    expect(screen.queryByRole('button', { name: /고객사/ })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /이름/ }))

    const updater = onSortingChange.mock.calls[0]![0]
    const next = typeof updater === 'function' ? updater([]) : updater
    expect(next).toEqual([{ id: 'name', desc: false }])
  })

  it('서버 페이지네이션: rowCount로 페이지 수를 계산하고 다음 페이지를 요청한다', async () => {
    const onPaginationChange = vi.fn()
    render(
      <DataTable
        data={data}
        columns={columns}
        rowCount={25}
        pagination={{ pageIndex: 0, pageSize: 10 }}
        onPaginationChange={onPaginationChange}
      />,
    )

    expect(screen.getByText(/1 \/ 3 페이지/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '이전' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: '다음' }))

    const updater = onPaginationChange.mock.calls[0]![0]
    const next = typeof updater === 'function' ? updater({ pageIndex: 0, pageSize: 10 }) : updater
    expect(next).toEqual({ pageIndex: 1, pageSize: 10 })
  })
})
