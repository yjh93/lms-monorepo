import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { fn } from 'storybook/test'
import { Button } from '../button/Button'
import { Modal } from './Modal'

const meta = {
  title: 'Components/Modal',
  component: Modal,
  args: {
    open: false,
    onClose: fn(),
    title: '수강생 삭제',
    description: '삭제한 수강생은 복구할 수 없습니다.',
  },
} satisfies Meta<typeof Modal>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState(false)
    const close = () => {
      setOpen(false)
      args.onClose()
    }
    return (
      <>
        <Button variant="danger" onClick={() => setOpen(true)}>
          삭제
        </Button>
        <Modal
          {...args}
          open={open}
          onClose={close}
          footer={
            <>
              <Button variant="neutral" size="lg" onClick={close}>
                취소
              </Button>
              <Button variant="danger" size="lg" onClick={close}>
                삭제
              </Button>
            </>
          }
        >
          김하나 수강생의 출석 기록과 수강 이력이 함께 삭제됩니다.
        </Modal>
      </>
    )
  },
}
