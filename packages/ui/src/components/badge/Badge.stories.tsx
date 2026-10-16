import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from './Badge'

const meta = {
  title: 'Components/Badge',
  component: Badge,
  args: { children: '수강중', tone: 'success' },
  argTypes: {
    tone: {
      control: 'inline-radio',
      options: ['neutral', 'brand', 'success', 'warning', 'danger'],
    },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Tones: Story = {
  render: () => (
    <div className="flex gap-2">
      <Badge tone="success">수강중</Badge>
      <Badge tone="warning">휴강</Badge>
      <Badge tone="brand">수료</Badge>
      <Badge tone="danger">중도포기</Badge>
      <Badge>대기</Badge>
    </div>
  ),
}
