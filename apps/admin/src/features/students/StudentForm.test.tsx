import { db } from '@lms/api-client/mocks'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderRoute } from '../../test/renderRoute'

async function fillRequired(user: ReturnType<typeof userEvent.setup>, email: string) {
  await user.type(screen.getByLabelText(/이름/), '홍길동')
  await user.type(screen.getByLabelText(/이메일/), email)
  await user.type(screen.getByLabelText(/휴대폰 번호/), '010-2222-3333')
  await user.type(screen.getByLabelText(/고객사/), '한빛전자')
}

describe('수강생 등록 폼', () => {
  it('공유 zod 스키마로 클라이언트 검증 메시지를 보여준다', async () => {
    const user = userEvent.setup()
    renderRoute('/students/new')

    await user.type(await screen.findByLabelText(/이름/), '홍')
    await user.type(screen.getByLabelText(/휴대폰 번호/), '1234')
    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(await screen.findByText('이름은 2자 이상 입력하세요.')).toBeInTheDocument()
    expect(screen.getByText('휴대폰 번호 형식이 올바르지 않습니다.')).toBeInTheDocument()
    expect(screen.getByLabelText(/이름/)).toHaveAttribute('aria-invalid', 'true')
  })

  it('서버의 중복 이메일 에러(409)를 이메일 필드 에러로 매핑한다', async () => {
    const user = userEvent.setup()
    renderRoute('/students/new')
    await screen.findByLabelText(/이름/)

    await fillRequired(user, db.students[0]!.email)
    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(await screen.findByText('이미 등록된 이메일입니다.')).toBeInTheDocument()
    expect(screen.getByLabelText(/이메일/)).toHaveAttribute('aria-invalid', 'true')
  })

  it('등록에 성공하면 목록으로 이동하고 새 수강생이 맨 위에 보인다', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/students/new')
    await screen.findByLabelText(/이름/)

    await fillRequired(user, 'gildong.hong@hanbit.co.kr')
    await user.click(screen.getByRole('button', { name: '등록' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/students'))
    expect(await screen.findByRole('link', { name: '홍길동' })).toBeInTheDocument()
    expect(db.students[0]).toMatchObject({ name: '홍길동', phone: '01022223333' })
  })
})

describe('수강생 수정 폼', () => {
  it('기존 값으로 채워지고, 변경 전에는 저장 버튼이 비활성화된다', async () => {
    const target = db.students[5]!
    renderRoute(`/students/${target.id}/edit`)

    expect(await screen.findByLabelText(/이름/)).toHaveValue(target.name)
    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled()
  })
})
