import { buildErrorReport, decodeCsv, parseStudentCsv } from './studentCsv'

const header = '이름,이메일,휴대폰 번호,고객사,부서,레벨,수강 상태,수강 시작일,메모'

function parseOk(text: string) {
  const result = parseStudentCsv(text)
  if (!result.ok) throw new Error(result.message)
  return result.rows
}

describe('parseStudentCsv', () => {
  it('한글 헤더/라벨을 코드로 변환하고 폼과 같은 규칙으로 정규화한다', () => {
    const [row] = parseOk(
      `${header}\n홍길동,Gildong@Example.com,010-1234-5678,한빛전자,인사팀,고급,휴강,2026-11-02,`,
    )
    expect(row).toMatchObject({
      ok: true,
      line: 2,
      values: {
        email: 'gildong@example.com',
        phone: '01012345678',
        level: 'ADVANCED',
        status: 'PAUSED',
      },
    })
  })

  it('영문 키 헤더도 허용하고, 상태가 비어 있으면 수강중으로 본다', () => {
    const [row] = parseOk(
      'name,email,phone,company,level,enrolledAt\n김영희,yh@example.com,01011112222,누리물산,BEGINNER,2026-11-02',
    )
    expect(row).toMatchObject({ ok: true, values: { status: 'ACTIVE', department: '' } })
  })

  it('행 단위로 필드 에러를 모으고 파일 내 이메일 중복을 잡는다', () => {
    const rows = parseOk(
      [
        header,
        '김,a@example.com,010-1111-2222,한빛전자,,초급,,2026-11-02,',
        '이두리,b@example.com,123,한빛전자,,초급,,날짜아님,',
        '박세나,c@example.com,010-3333-4444,한빛전자,,초급,,2026-11-02,',
        '최네오,c@example.com,010-5555-6666,한빛전자,,초급,,2026-11-02,',
      ].join('\n'),
    )

    expect(rows.map((r) => r.ok)).toEqual([false, false, true, false])
    expect(rows[0]).toMatchObject({ errors: { name: '이름은 2자 이상 입력하세요.' } })
    expect(rows[1]).toMatchObject({
      errors: { phone: expect.any(String), enrolledAt: '수강 시작일을 선택하세요.' },
    })
    expect(rows[3]).toMatchObject({ line: 5, errors: { email: '4행과 이메일이 중복됩니다.' } })
  })

  it('필수 열이 없으면 파일 단위 에러', () => {
    const result = parseStudentCsv('이름,이메일\n홍길동,a@example.com')
    expect(result).toEqual({
      ok: false,
      message: '필수 열이 없습니다: 휴대폰 번호, 고객사, 레벨, 수강 시작일',
    })
  })

  it('오류 리포트에는 실패한 행만 행 번호·메시지와 함께 담긴다', () => {
    const rows = parseOk(
      `${header}\n김,a@example.com,010-1111-2222,한빛전자,,초급,,2026-11-02,\n박세나,c@example.com,010-3333-4444,한빛전자,,초급,,2026-11-02,`,
    )
    const report = buildErrorReport(rows)
    expect(report.startsWith('\uFEFF')).toBe(true)
    const lines = report.slice(1).split(/\r?\n/)
    expect(lines).toHaveLength(2)
    expect(lines[1]).toContain('이름: 이름은 2자 이상 입력하세요.')
  })
})

describe('decodeCsv', () => {
  it('UTF-8이 아니면 EUC-KR(CP949)로 디코딩한다', () => {
    // "이름" in EUC-KR
    const eucKr = new Uint8Array([0xc0, 0xcc, 0xb8, 0xa7])
    expect(decodeCsv(eucKr.buffer)).toBe('이름')
    expect(decodeCsv(new TextEncoder().encode('이름').buffer as ArrayBuffer)).toBe('이름')
  })
})
