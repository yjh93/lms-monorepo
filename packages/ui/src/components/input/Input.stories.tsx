import type { Meta, StoryObj } from '@storybook/react-vite'
import { Input } from './Input'

const meta = {
  title: 'Components/Input',
  component: Input,
  args: { label: '이름', placeholder: '홍길동' },
  decorators: [(Story) => <div className="max-w-sm">{Story()}</div>],
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Required: Story = { args: { required: true } }

export const WithHint: Story = {
  args: { label: '전화번호', placeholder: '01012345678', hint: '- 없이 숫자만 입력' },
}

export const WithError: Story = {
  args: { label: '이메일', defaultValue: 'abc', error: '이메일 형식이 아닙니다.' },
}

export const Disabled: Story = { args: { disabled: true, defaultValue: '수정 불가' } }
