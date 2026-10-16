import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from './Modal'

describe('Modal', () => {
  it('open일 때 제목과 내용을 dialog로 노출한다', () => {
    render(
      <Modal open onClose={() => {}} title="수강생 삭제">
        정말 삭제할까요?
      </Modal>,
    )

    const dialog = screen.getByRole('dialog', { name: '수강생 삭제' })
    expect(dialog).toHaveAttribute('open')
    expect(dialog).toHaveTextContent('정말 삭제할까요?')
  })

  it('닫기 버튼과 ESC(cancel 이벤트)로 onClose를 호출한다', async () => {
    const onClose = vi.fn()
    render(<Modal open onClose={onClose} title="알림" />)

    await userEvent.click(screen.getByRole('button', { name: '닫기' }))
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))

    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('open이 false면 내용을 렌더링하지 않는다', () => {
    render(<Modal open={false} onClose={() => {}} title="숨김" />)
    expect(screen.queryByText('숨김')).not.toBeInTheDocument()
  })
})
