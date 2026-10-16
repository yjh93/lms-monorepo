import { describe, expect, it } from 'vitest'
import {
  defaultStudentListQuery,
  parseStudentListQuery,
  studentFormDefaults,
  studentFormSchema,
  toStudentListSearchParams,
} from './student'

const validInput = {
  ...studentFormDefaults,
  name: ' 김하나 ',
  email: 'Hana.Kim@Example.com',
  phone: '010-1234-5678',
  company: '한빛전자',
  enrolledAt: '2026-10-01',
}

describe('studentFormSchema', () => {
  it('입력값을 정규화한다(trim, 이메일 소문자, 전화번호 숫자만)', () => {
    const result = studentFormSchema.parse(validInput)
    expect(result).toMatchObject({
      name: '김하나',
      email: 'hana.kim@example.com',
      phone: '01012345678',
    })
  })

  it('필드별 한국어 에러 메시지를 반환한다', () => {
    const result = studentFormSchema.safeParse({ ...validInput, name: '김', phone: '0212345678' })
    expect(result.success).toBe(false)
    const messages = Object.fromEntries(
      result.error!.issues.map((issue) => [issue.path.join('.'), issue.message]),
    )
    expect(messages).toEqual({
      name: '이름은 2자 이상 입력하세요.',
      phone: '휴대폰 번호 형식이 올바르지 않습니다.',
    })
  })
})

describe('student list query ↔ URLSearchParams', () => {
  it('빈 쿼리는 기본값으로 파싱된다', () => {
    expect(parseStudentListQuery(new URLSearchParams())).toEqual(defaultStudentListQuery)
  })

  it('잘못된 값은 해당 항목만 기본값으로 대체한다', () => {
    const query = parseStudentListQuery(
      new URLSearchParams('page=-3&pageSize=999&sort=hack&status=ACTIVE&status=WRONG&q=%20김%20'),
    )
    expect(query).toMatchObject({
      page: 1,
      pageSize: 10,
      sort: 'createdAt',
      status: ['ACTIVE'],
      q: '김',
    })
  })

  it('직렬화 시 기본값은 생략하고 배열은 반복 키로 만든다', () => {
    const params = toStudentListSearchParams({
      page: 2,
      status: ['ACTIVE', 'PAUSED'],
      sort: 'createdAt',
    })
    expect(params.toString()).toBe('page=2&status=ACTIVE&status=PAUSED')
  })

  it('parse(serialize(q)) === q (왕복 변환이 손실 없다)', () => {
    const query = {
      ...defaultStudentListQuery,
      page: 3,
      pageSize: 20 as const,
      sort: 'name' as const,
      order: 'asc' as const,
      level: ['ADVANCED' as const],
      company: '누리물산',
      q: 'kim',
    }
    expect(parseStudentListQuery(toStudentListSearchParams(query))).toEqual(query)
  })
})
