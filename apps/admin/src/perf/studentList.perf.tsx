import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mkdirSync, writeFileSync } from 'node:fs'
import { renderRoute } from '../test/renderRoute'
import { renderCounter } from './devtoolsHook'

/** 테이블이 다시 그려질 때까지(aria-busy 해제) 기다린다. */
async function settle() {
  await waitFor(() =>
    expect(screen.getByRole('table', { name: '수강생 목록' })).not.toHaveAttribute('aria-busy'),
  )
}

const TRACKED = [
  'StudentListPage',
  'StudentFilters',
  'PageHeader',
  'CheckboxGroup',
  'Input',
  'Select',
  'Field',
  'Button',
  'DataTable',
  'Badge',
  'SortIcon',
  'Link',
]

it('수강생 목록 상호작용 시나리오의 컴포넌트 렌더 횟수', async () => {
  const user = userEvent.setup()
  renderRoute('/students')
  await screen.findByRole('table', { name: '수강생 목록' })
  await settle()

  renderCounter.start()
  await user.click(screen.getByRole('checkbox', { name: '수강중' }))
  await settle()
  await user.click(screen.getByRole('checkbox', { name: '휴강' }))
  await settle()
  await user.click(screen.getByRole('button', { name: /이름/ }))
  await settle()
  await user.click(screen.getByRole('button', { name: '다음' }))
  await settle()
  await user.type(screen.getByRole('searchbox', { name: '검색' }), '김')
  await waitFor(() => expect(screen.getByText(/1 \/ \d+ 페이지/)).toBeInTheDocument())
  await settle()
  const counts = renderCounter.stop()

  const total = [...counts.values()].reduce((sum, n) => sum + n, 0)
  const result = {
    compiler: process.env.REACT_COMPILER !== 'false',
    total,
    tracked: Object.fromEntries(TRACKED.map((name) => [name, counts.get(name) ?? 0])),
  }
  mkdirSync('perf-results', { recursive: true })
  writeFileSync(
    `perf-results/render-${result.compiler ? 'compiler' : 'baseline'}.json`,
    JSON.stringify(result, null, 2),
  )
  expect(total).toBeGreaterThan(0)
})
