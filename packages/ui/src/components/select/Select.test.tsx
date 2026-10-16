import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Select } from './Select'

const options = [
  { value: 'ACTIVE', label: '수강중' },
  { value: 'PAUSED', label: '휴강' },
]

describe('Select', () => {
  it('placeholder 옵션과 전달된 옵션을 렌더링한다', () => {
    render(<Select label="상태" placeholder="전체" options={options} />)

    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      '전체',
      '수강중',
      '휴강',
    ])
  })

  it('선택 시 onChange로 value를 전달한다', async () => {
    const onChange = vi.fn()
    render(<Select label="상태" options={options} onChange={(e) => onChange(e.target.value)} />)

    await userEvent.selectOptions(screen.getByLabelText('상태'), 'PAUSED')

    expect(onChange).toHaveBeenCalledWith('PAUSED')
  })
})
