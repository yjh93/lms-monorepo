import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderRoute } from '../../test/renderRoute'

async function findDataRows() {
  const table = await screen.findByRole('table', { name: '수강생 목록' })
  await waitFor(() => expect(within(table).getAllByRole('row').length).toBeGreaterThan(1))
  return within(table).getAllByRole('row').slice(1)
}

describe('StudentListPage', () => {
  it('URL 쿼리로부터 필터·페이지 상태를 복원한다', async () => {
    renderRoute('/students?status=PAUSED&pageSize=20&page=1')

    expect(await screen.findByRole('checkbox', { name: '휴강' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: '수강중' })).not.toBeChecked()

    const rows = await findDataRows()
    for (const row of rows) expect(within(row).getByText('휴강')).toBeInTheDocument()
  })

  it('필터를 바꾸면 URL에 반영되고 1페이지로 돌아간다', async () => {
    const user = userEvent.setup()
    const { searchParams } = renderRoute('/students?page=3')
    await findDataRows()

    await user.click(screen.getByRole('checkbox', { name: '수강중' }))
    await user.click(screen.getByRole('checkbox', { name: '휴강' }))

    await waitFor(() => expect(searchParams().getAll('status')).toEqual(['ACTIVE', 'PAUSED']))
    expect(searchParams().get('page')).toBeNull()
  })

  it('헤더 클릭으로 서버 정렬 상태를 URL에 기록한다', async () => {
    const user = userEvent.setup()
    const { searchParams } = renderRoute('/students')
    await findDataRows()

    await user.click(screen.getByRole('button', { name: /이름/ }))

    await waitFor(() => expect(searchParams().get('sort')).toBe('name'))
    const header = screen.getByRole('columnheader', { name: /이름/ })
    await waitFor(() => expect(header).toHaveAttribute('aria-sort'))
  })

  it('검색어는 디바운스 후 URL q로 반영된다', async () => {
    const user = userEvent.setup()
    const { searchParams } = renderRoute('/students')
    await findDataRows()

    await user.type(screen.getByRole('searchbox', { name: '검색' }), '인사팀')

    await waitFor(() => expect(searchParams().get('q')).toBe('인사팀'))
    // keepPreviousData: 새 응답이 올 때까지 이전 행이 남아 있으므로 결과가 바뀔 때까지 기다린다.
    await waitFor(async () => {
      for (const row of await findDataRows()) expect(row).toHaveTextContent('인사팀')
    })
  })

  it('다음 페이지로 이동하면 page 쿼리가 증가한다', async () => {
    const user = userEvent.setup()
    const { searchParams } = renderRoute('/students')
    await findDataRows()

    await user.click(screen.getByRole('button', { name: '다음' }))

    await waitFor(() => expect(searchParams().get('page')).toBe('2'))
    expect(await screen.findByText(/2 \/ 14 페이지/)).toBeInTheDocument()
  })
})
