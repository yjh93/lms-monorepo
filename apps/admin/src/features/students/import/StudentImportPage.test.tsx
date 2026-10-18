import { db } from '@lms/api-client/mocks'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderRoute } from '../../../test/renderRoute'

const header = '이름,이메일,휴대폰 번호,고객사,부서,레벨,수강 상태,수강 시작일,메모'

function csvFile(lines: string[], name = 'students.csv') {
  return new File([lines.join('\n')], name, { type: 'text/csv' })
}

describe('CSV 일괄 등록', () => {
  it('행 단위 검증 결과를 보여주고, 정상 행만 등록한다(서버 중복 검사 결과도 반영)', async () => {
    const user = userEvent.setup()
    const existingEmail = db.students[0]!.email
    const before = db.students.length
    renderRoute('/students/import')

    await user.upload(
      await screen.findByLabelText('CSV 파일 선택'),
      csvFile([
        header,
        '홍길동,gildong@example.com,010-1234-5678,한빛전자,인사팀,중급,수강중,2026-11-02,',
        '김,short@example.com,010-1234-5678,한빛전자,,초급,,2026-11-02,',
        `이미등록,${existingEmail},010-9999-8888,한빛전자,,초급,,2026-11-02,`,
      ]),
    )

    const summary = await screen.findByRole('region', { name: '검증 요약' })
    expect(within(summary).getByText('3행')).toBeInTheDocument()
    expect(within(summary).getByText('2행')).toBeInTheDocument() // 등록 가능(파일 기준)
    expect(screen.getByText(/이름은 2자 이상/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '정상 2건 등록' }))

    expect(await screen.findByRole('status')).toHaveTextContent('1명을 등록했습니다.')
    // 오류만 보기로 전환되어 클라이언트 오류 행 + 서버 중복 행이 보인다
    const table = screen.getByRole('table', { name: 'CSV 검증 결과' })
    await waitFor(() => expect(within(table).getAllByRole('row')).toHaveLength(3))
    expect(within(table).getByText(/이미 등록된 이메일입니다/)).toBeInTheDocument()
    expect(db.students.length).toBe(before + 1)
  })

  it('필수 열이 없으면 파일 단위 오류를 보여준다', async () => {
    const user = userEvent.setup()
    renderRoute('/students/import')

    await user.upload(
      await screen.findByLabelText('CSV 파일 선택'),
      csvFile(['이름,이메일', '홍길동,a@example.com']),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent('필수 열이 없습니다')
  })

  it('TEACHER는 접근할 수 없다', async () => {
    renderRoute('/students/import', { role: 'TEACHER' })
    expect(await screen.findByRole('heading', { name: '접근 권한이 없습니다' })).toBeInTheDocument()
  })
})
