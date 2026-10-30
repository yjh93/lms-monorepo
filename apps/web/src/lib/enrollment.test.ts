import { describe, expect, it } from 'vitest'
import { courseTable } from './course-data'
import { submitEnrollment } from './enrollment'

const course = courseTable[0]!

function createDeps(enrolledCount: number) {
  const counts = new Map([[course.slug, enrolledCount]])
  return {
    findCourse: (slug: string) => courseTable.find((c) => c.slug === slug) ?? null,
    enrolled: (slug: string) => counts.get(slug) ?? 0,
    add: (slug: string, n: number) => counts.set(slug, (counts.get(slug) ?? 0) + n),
    now: () => new Date('2026-10-30T09:00:00Z'),
    counts,
  }
}

function form(overrides: Record<string, string | undefined> = {}) {
  const data = new FormData()
  const values: Record<string, string | undefined> = {
    courseSlug: course.slug,
    name: '홍길동',
    email: 'Gildong@Company.com',
    phone: '010-1234-5678',
    company: '한빛전자',
    headcount: '3',
    message: '',
    agree: 'on',
    ...overrides,
  }
  for (const [key, value] of Object.entries(values)) if (value !== undefined) data.set(key, value)
  return data
}

describe('submitEnrollment', () => {
  it('정상 신청: 좌석을 차감하고 접수 번호를 발급한다', () => {
    const deps = createDeps(0)
    const state = submitEnrollment(form(), deps)

    expect(state).toMatchObject({ status: 'success', headcount: 3, email: 'gildong@company.com' })
    expect(state.status === 'success' && state.reference).toMatch(/^LW-261030-BUS003$/)
    expect(deps.counts.get(course.slug)).toBe(3)
  })

  it('공유 스키마 검증: 필드별 메시지를 돌려주고 입력값은 유지한다(동의 체크는 제외)', () => {
    const state = submitEnrollment(
      form({ name: '홍', phone: '123', agree: undefined }),
      createDeps(0),
    )

    expect(state.status).toBe('error')
    if (state.status !== 'error') return
    expect(state.fieldErrors).toMatchObject({
      name: '이름은 2자 이상 입력하세요.',
      phone: '휴대폰 번호 형식이 올바르지 않습니다.',
      agree: '개인정보 수집·이용에 동의해 주세요.',
    })
    expect(state.values).toMatchObject({ name: '홍', company: '한빛전자' })
    expect(state.values).not.toHaveProperty('agree')
  })

  it('남은 좌석보다 많으면 거절하고 남은 수를 알려준다', () => {
    const deps = createDeps(course.capacity - 2)
    const state = submitEnrollment(form({ headcount: '3' }), deps)

    expect(state).toMatchObject({
      status: 'error',
      fieldErrors: { headcount: '현재 2석 남았습니다.' },
    })
    expect(deps.counts.get(course.slug)).toBe(course.capacity - 2)
  })

  it('조작된 강좌 식별자는 거절한다', () => {
    const state = submitEnrollment(form({ courseSlug: 'no-such-course' }), createDeps(0))
    expect(state).toMatchObject({ status: 'error', message: '존재하지 않는 강좌입니다.' })
  })
})
