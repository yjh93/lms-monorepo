import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { renderRoute } from '../test/renderRoute'
import { server } from '../test/server'
import { authStore } from './authStore'

describe('로그인과 라우트 가드', () => {
  it('비로그인 상태로 보호된 경로에 접근하면 로그인 후 원래 경로로 돌아간다', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/students?status=PAUSED', { role: null })

    expect(await screen.findByRole('form', { name: '로그인' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')

    await user.click(screen.getByRole('radio', { name: /운영 매니저/ }))
    await user.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/students'))
    expect(router.state.location.search).toBe('?status=PAUSED')
    expect(authStore.getUser()?.role).toBe('MANAGER')
  })

  it('로그아웃하면 로그인 화면으로 이동한다', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/students')

    await user.click(await screen.findByRole('button', { name: '로그아웃' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(authStore.getUser()).toBeNull()
  })

  it('직접 로그아웃한 뒤 다시 로그인하면 이전 화면이 아니라 역할별 첫 화면으로 간다', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/audit-logs')

    await user.click(await screen.findByRole('button', { name: '로그아웃' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    await user.click(screen.getByRole('radio', { name: /강사/ }))
    await user.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/lessons'))
  })
})

describe('RBAC', () => {
  it('TEACHER: 등록 버튼이 없고, 이름이 수정 링크가 아니다', async () => {
    renderRoute('/students', { role: 'TEACHER' })

    await screen.findAllByRole('row')
    await waitFor(() => expect(screen.getAllByRole('row').length).toBeGreaterThan(2))
    expect(screen.queryByRole('button', { name: '수강생 등록' })).not.toBeInTheDocument()
    const hrefs = screen.queryAllByRole('link').map((a) => a.getAttribute('href') ?? '')
    expect(hrefs.some((href) => href.endsWith('/edit'))).toBe(false)
  })

  it('TEACHER가 등록 URL을 직접 입력하면 403 화면을 보여준다', async () => {
    renderRoute('/students/new', { role: 'TEACHER' })
    expect(await screen.findByRole('heading', { name: '접근 권한이 없습니다' })).toBeInTheDocument()
  })

  it('서버가 401을 주면 로그인 상태를 비우고 로그인 화면으로 보낸다', async () => {
    // 화면은 로그인 상태지만 서버 세션이 만료된 상황
    server.use(
      http.get('*/api/students', () =>
        HttpResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 }),
      ),
    )
    const { router } = renderRoute('/students')

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(authStore.getUser()).toBeNull()
  })
})
