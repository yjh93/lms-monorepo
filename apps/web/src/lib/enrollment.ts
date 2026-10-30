import { enrollmentFormSchema, type EnrollmentField } from '@lms/api-client'
import type { Course } from '@lms/api-client'

export type EnrollmentState =
  | { status: 'idle' }
  | {
      status: 'error'
      message: string
      fieldErrors: Partial<Record<EnrollmentField, string>>
      /** 실패 시 입력값을 되돌려 줘 폼이 비워지지 않게 한다(JS 없이 제출해도 동일). */
      values: Partial<Record<EnrollmentField, string>>
    }
  | { status: 'success'; reference: string; headcount: number; email: string; remaining: number }

export const initialEnrollmentState: EnrollmentState = { status: 'idle' }

interface Deps {
  findCourse: (slug: string) => Course | null
  enrolled: (slug: string) => number
  add: (slug: string, headcount: number) => void
  now?: () => Date
}

/**
 * 수강 신청 처리(순수 로직). Server Action은 이 함수를 호출하고 캐시만 갱신한다.
 * 검증은 api-client의 enrollmentFormSchema — 클라이언트 JS가 없어도 서버가 같은 규칙으로 막는다.
 */
export function submitEnrollment(formData: FormData, deps: Deps): EnrollmentState {
  const raw = Object.fromEntries(
    [...formData.entries()].map(([key, value]) => [key, typeof value === 'string' ? value : '']),
  ) as Partial<Record<EnrollmentField, string>>
  const { agree: _agree, ...values } = raw

  const parsed = enrollmentFormSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Partial<Record<EnrollmentField, string>> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as EnrollmentField
      fieldErrors[field] ??= issue.message
    }
    return { status: 'error', message: '입력값을 확인해 주세요.', fieldErrors, values }
  }

  const { courseSlug, headcount, email } = parsed.data
  const course = deps.findCourse(courseSlug)
  if (!course) {
    return { status: 'error', message: '존재하지 않는 강좌입니다.', fieldErrors: {}, values }
  }

  const remaining = course.capacity - deps.enrolled(courseSlug)
  if (headcount > remaining) {
    return {
      status: 'error',
      message: remaining === 0 ? '모집이 마감되었습니다.' : '남은 자리보다 신청 인원이 많습니다.',
      fieldErrors: { headcount: `현재 ${remaining}석 남았습니다.` },
      values,
    }
  }

  deps.add(courseSlug, headcount)
  const now = (deps.now ?? (() => new Date()))()
  const reference = `LW-${now.toISOString().slice(2, 10).replaceAll('-', '')}-${courseSlug.slice(0, 3).toUpperCase()}${String(deps.enrolled(courseSlug)).padStart(3, '0')}`
  return { status: 'success', reference, headcount, email, remaining: remaining - headcount }
}
