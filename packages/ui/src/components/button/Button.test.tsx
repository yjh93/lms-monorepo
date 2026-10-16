import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('클릭 핸들러를 호출한다', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>저장</Button>)

    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('loading 상태에서는 비활성화되고 aria-busy를 노출한다', () => {
    render(<Button loading>저장</Button>)

    const button = screen.getByRole('button', { name: '저장' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
  })

  it('기본 type은 submit이 아니라 button이다', () => {
    render(<Button>확인</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })
})
