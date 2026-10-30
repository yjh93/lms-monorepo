import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderRoute } from '../../test/renderRoute'
import { useAnalyticsStore } from './analyticsStore'
import { createAnalyticsService } from './engine/service'

// jsdom에는 Web Worker가 없으므로 같은 인터페이스의 메인 스레드 구현을 주입한다.
const client = createAnalyticsService(30_000, new Date())

// jsdom은 레이아웃이 없어 요소 크기가 0이다. 가상 스크롤(TanStack Virtual은 clientHeight로 측정)이
// 보이는 영역을 계산할 수 있도록 이 파일에서만 크기를 준다.
const sizes = { clientHeight: 560, clientWidth: 1000 } as const
beforeAll(() => {
  for (const [prop, value] of Object.entries(sizes)) {
    Object.defineProperty(HTMLElement.prototype, prop, { configurable: true, get: () => value })
  }
})
afterAll(() => {
  for (const prop of Object.keys(sizes)) {
    delete (HTMLElement.prototype as unknown as Record<string, unknown>)[prop]
  }
})

describe('출석 분석', () => {
  beforeEach(() => useAnalyticsStore.getState().reset())

  it('KPI와 차트를 그리고, 필터를 바꾸면 집계가 다시 계산된다', async () => {
    const user = userEvent.setup()
    renderRoute('/analytics', { analyticsClient: client })

    // 첫 집계는 테스트 데이터셋 생성과 겹쳐 병렬 실행 시 느릴 수 있다.
    const matched = await screen.findByText('조건에 맞는 기록', {}, { timeout: 10_000 })
    const tile = matched.parentElement!
    const before = within(tile).getByText(/건$/).textContent

    await user.click(screen.getByRole('checkbox', { name: '결석' }))

    await waitFor(() => expect(within(tile).getByText(/건$/).textContent).not.toBe(before), {
      timeout: 10_000,
    })
    expect(useAnalyticsStore.getState().filters.statuses).toEqual(['ABSENT'])
    expect(screen.getByRole('region', { name: '요일 · 시간대별 출석률' })).toBeInTheDocument()
  })

  it('히트맵 셀을 누르면 교차 필터가 걸리고 해제할 수 있다', async () => {
    const user = userEvent.setup()
    renderRoute('/analytics', { analyticsClient: client })

    const cell = await screen.findByLabelText(/^수요일 12시 출석률/, {}, { timeout: 8000 })
    await user.click(cell)

    await waitFor(() =>
      expect(screen.getByLabelText(/^수요일 12시 출석률/)).toHaveAttribute('aria-pressed', 'true'),
    )
    expect(await screen.findByText('수요일 12시 수업만 보는 중')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '해제' }))
    expect(useAnalyticsStore.getState().filters.cell).toBeNull()
  })

  it('출석 로그는 가상 스크롤로 일부 행만 렌더링한다', async () => {
    renderRoute('/analytics', { analyticsClient: client })

    const table = await screen.findByRole('table', { name: '출석 로그' }, { timeout: 10_000 })
    await waitFor(() => expect(within(table).getAllByRole('row').length).toBeGreaterThan(1), {
      timeout: 10_000,
    })
    // 헤더 1행 + 보이는 영역(+overscan)만: 전체 일치 건수보다 훨씬 적다
    expect(within(table).getAllByRole('row').length).toBeLessThan(60)
    expect(Number(table.getAttribute('aria-rowcount'))).toBeGreaterThan(1000)
  })

  it('강사는 접근할 수 없다', async () => {
    renderRoute('/analytics', { role: 'TEACHER', analyticsClient: client })
    expect(await screen.findByRole('heading', { name: '접근 권한이 없습니다' })).toBeInTheDocument()
  })
})
