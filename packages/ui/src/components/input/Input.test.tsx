import { render, screen } from '@testing-library/react'
import { Input } from './Input'

describe('Input', () => {
  it('label로 입력 요소를 찾을 수 있다', () => {
    render(<Input label="이름" />)
    expect(screen.getByLabelText('이름')).toBeInTheDocument()
  })

  it('error가 있으면 aria-invalid와 에러 메시지를 연결한다', () => {
    render(<Input label="이메일" error="이메일 형식이 아닙니다." />)

    const input = screen.getByLabelText('이메일')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('이메일 형식이 아닙니다.')
    expect(screen.getByRole('alert')).toHaveTextContent('이메일 형식이 아닙니다.')
  })

  it('hint는 error가 없을 때만 설명으로 연결된다', () => {
    render(<Input label="전화번호" hint="- 없이 입력" />)
    expect(screen.getByLabelText('전화번호')).toHaveAccessibleDescription('- 없이 입력')
  })
})
