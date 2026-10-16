import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Button } from './Button'

const meta = {
  title: 'Components/Button',
  component: Button,
  args: { children: '저장', onClick: fn() },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'ghost', 'danger'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {}

export const Variants: Story = {
  render: (args) => (
    <div className="flex gap-2">
      <Button {...args} variant="primary">
        등록
      </Button>
      <Button {...args} variant="secondary">
        취소
      </Button>
      <Button {...args} variant="ghost">
        더보기
      </Button>
      <Button {...args} variant="danger">
        삭제
      </Button>
    </div>
  ),
}

export const Loading: Story = { args: { loading: true, children: '저장 중' } }

export const Disabled: Story = { args: { disabled: true } }
