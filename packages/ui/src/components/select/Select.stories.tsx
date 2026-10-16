import type { Meta, StoryObj } from '@storybook/react-vite'
import { Select } from './Select'

const meta = {
  title: 'Components/Select',
  component: Select,
  args: {
    label: '수강 상태',
    placeholder: '전체',
    options: [
      { value: 'ACTIVE', label: '수강중' },
      { value: 'PAUSED', label: '휴강' },
      { value: 'COMPLETED', label: '수료' },
      { value: 'DROPPED', label: '중도포기' },
    ],
  },
  decorators: [(Story) => <div className="max-w-sm">{Story()}</div>],
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithError: Story = { args: { required: true, error: '수강 상태를 선택하세요.' } }
