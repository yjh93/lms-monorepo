import { db } from '@lms/api-client/mocks'
import { toISODate } from '@lms/utils'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http } from 'msw'
import { renderRoute } from '../../test/renderRoute'
import { server } from '../../test/server'

/** Emily Carter(tch_01, TEACHER 데모 계정)의 지난 수업 */
function pastLessonOfDemoTeacher() {
  const today = toISODate(new Date())
  return db.lessons.find((lesson) => {
    const group = db.groups.find((g) => g.id === lesson.groupId)!
    return group.teacherId === 'tch_01' && lesson.date < today && !lesson.canceled
  })!
}

function firstStudentRow() {
  const roster = screen.getByRole('list', { name: '출석부' })
  return within(roster).getAllByRole('listitem')[0]!
}

describe('출석 체크 (useOptimistic)', () => {
  it('클릭 즉시 낙관적으로 반영되고, 저장이 끝나면 서버 값으로 확정된다', async () => {
    const user = userEvent.setup()
    const lesson = pastLessonOfDemoTeacher()
    // 응답을 늦춰 "저장 중" 구간을 관찰한다
    server.use(
      http.put('*/api/lessons/:id/attendance/:studentId', async () => {
        await delay(300)
      }),
    )
    renderRoute(`/lessons/${lesson.id}`, { role: 'TEACHER' })
    await screen.findByRole('list', { name: '출석부' })

    const row = firstStudentRow()
    const current = within(row)
      .getAllByRole('button')
      .find((b) => b.ariaPressed === 'true')
    const target = within(row).getByRole('button', {
      name: current?.textContent === '결석' ? '출석' : '결석',
    })

    await user.click(target)

    // 서버 응답 전: 이미 선택 상태 + 저장 중 표시
    expect(target).toHaveAttribute('aria-pressed', 'true')
    expect(within(row).getByText('저장 중…')).toBeInTheDocument()

    await waitFor(() => expect(within(row).queryByText('저장 중…')).not.toBeInTheDocument())
    expect(target).toHaveAttribute('aria-pressed', 'true')
    const studentId = [...db.attendance.get(lesson.id)!.keys()][0]!
    expect(db.attendance.get(lesson.id)!.get(studentId)).toBe(
      target.textContent === '결석' ? 'ABSENT' : 'PRESENT',
    )
  })

  it('저장에 실패하면 자동으로 이전 상태로 돌아가고 오류를 알린다', async () => {
    const user = userEvent.setup()
    const lesson = pastLessonOfDemoTeacher()
    renderRoute(`/lessons/${lesson.id}`, { role: 'TEACHER' })
    await screen.findByRole('list', { name: '출석부' })

    await user.click(screen.getByRole('checkbox', { name: /저장 실패 시뮬레이션/ }))
    const row = firstStudentRow()
    const before = within(row)
      .getAllByRole('button')
      .map((b) => b.getAttribute('aria-pressed'))
    const target = within(row)
      .getAllByRole('button')
      .find((b) => b.getAttribute('aria-pressed') === 'false')!

    await user.click(target)

    expect(await screen.findByRole('alert')).toHaveTextContent('이전 상태로 되돌렸습니다')
    expect(
      within(row)
        .getAllByRole('button')
        .map((b) => b.getAttribute('aria-pressed')),
    ).toEqual(before)
  })

  it('강사가 다른 강사의 수업에 접근하면 서버 403 메시지를 보여준다', async () => {
    const other = db.lessons.find(
      (l) => db.groups.find((g) => g.id === l.groupId)!.teacherId !== 'tch_01',
    )!
    renderRoute(`/lessons/${other.id}`, { role: 'TEACHER' })
    expect(await screen.findByRole('alert')).toHaveTextContent('담당 수업만 조회할 수 있습니다.')
  })

  it('강사 로그인 시 첫 화면은 내 수업이고, 수업을 눌러 출석부로 이동한다', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/', { role: 'TEACHER' })

    expect(await screen.findByRole('heading', { name: '내 수업' })).toBeInTheDocument()
    const links = await screen.findAllByRole('link', { name: /–/ })
    await user.click(links[0]!)

    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/lessons\/les_/))
    expect(await screen.findByRole('list', { name: '출석부' })).toBeInTheDocument()
  })
})
