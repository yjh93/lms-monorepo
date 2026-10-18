import { db } from '@lms/api-client/mocks'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderRoute } from '../../test/renderRoute'

describe('대시보드', () => {
  it('관리자/매니저의 첫 화면이며 KPI를 보여준다', async () => {
    const { router } = renderRoute('/', { role: 'MANAGER' })

    expect(await screen.findByRole('heading', { name: '대시보드' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/dashboard')
    expect(await screen.findByText(`${db.students.length}명`)).toBeInTheDocument()
    expect(screen.getByText('최근 4주 출석률')).toBeInTheDocument()
  })

  it('차트 데이터를 표로도 제공한다(색에만 의존하지 않음)', async () => {
    const user = userEvent.setup()
    renderRoute('/dashboard')

    const card = await screen.findByRole('region', { name: '고객사별 수강 현황' })
    await user.click(within(card).getByText('표로 보기'))

    const table = within(card).getByRole('table', { name: '고객사별 수강 현황' })
    const companies = new Set(db.students.map((s) => s.company))
    expect(within(table).getAllByRole('row')).toHaveLength(companies.size + 1)
    expect(within(table).getByRole('columnheader', { name: '중도포기' })).toBeInTheDocument()
  })

  it('강사는 대시보드 메뉴가 없고 URL 접근 시 403', async () => {
    renderRoute('/dashboard', { role: 'TEACHER' })
    expect(await screen.findByRole('heading', { name: '접근 권한이 없습니다' })).toBeInTheDocument()
  })
})
