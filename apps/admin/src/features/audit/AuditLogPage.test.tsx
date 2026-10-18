import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderRoute } from '../../test/renderRoute'

describe('변경 이력', () => {
  it('수강생 정보를 수정하면 필드 단위 변경 내역이 기록된다', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/students')

    const table = await screen.findByRole('table', { name: '수강생 목록' })
    const firstLink = await within(table).findAllByRole('link')
    await user.click(firstLink[0]!)

    const department = await screen.findByLabelText('부서')
    await user.clear(department)
    await user.type(department, '글로벌사업팀')
    await user.click(screen.getByRole('button', { name: '저장' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/students'))

    await router.navigate('/audit-logs')

    const logTable = await screen.findByRole('table', { name: '변경 이력' })
    expect(await within(logTable).findByText('수강생 수정')).toBeInTheDocument()
    expect(within(logTable).getByText('글로벌사업팀')).toBeInTheDocument()
    expect(within(logTable).getByText(/김관리/)).toBeInTheDocument()
  })

  it('MANAGER는 메뉴가 보이지 않고, URL로 접근하면 403', async () => {
    renderRoute('/audit-logs', { role: 'MANAGER' })

    expect(await screen.findByRole('heading', { name: '접근 권한이 없습니다' })).toBeInTheDocument()
    expect(
      within(screen.getByRole('navigation', { name: '주 메뉴' })).queryByRole('link', {
        name: '변경 이력',
      }),
    ).not.toBeInTheDocument()
  })
})
