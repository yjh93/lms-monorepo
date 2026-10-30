import { z } from 'zod'
import { emailField, mobilePhoneField, personNameField } from './fields'
import { languageSchema } from './lesson'
import { levelSchema } from './student'

export const COURSE_FORMATS = ['ONLINE', 'ONSITE', 'BLENDED'] as const
export const courseFormatSchema = z.enum(COURSE_FORMATS)
export type CourseFormat = z.infer<typeof courseFormatSchema>

export const COURSE_FORMAT_LABEL: Record<CourseFormat, string> = {
  ONLINE: '실시간 온라인',
  ONSITE: '기업 방문',
  BLENDED: '온·오프라인 혼합',
}

export const courseSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  subtitle: z.string(),
  language: languageSchema,
  level: levelSchema,
  format: courseFormatSchema,
  weeks: z.number().int().positive(),
  sessionsPerWeek: z.number().int().positive(),
  minutesPerSession: z.number().int().positive(),
  /** 1인당 수강료(원) */
  price: z.number().int().nonnegative(),
  capacity: z.number().int().positive(),
  startDate: z.iso.date(),
  teacher: z.object({ name: z.string(), title: z.string(), bio: z.string() }),
  summary: z.string(),
  outcomes: z.array(z.string()),
  curriculum: z.array(
    z.object({ week: z.number().int(), title: z.string(), topics: z.array(z.string()) }),
  ),
  tags: z.array(z.string()),
})
export type Course = z.infer<typeof courseSchema>

/** 강좌 목록 필터(URL 쿼리). 잘못된 값은 "전체"로 취급한다. */
export const courseListQuerySchema = z.object({
  language: languageSchema.or(z.literal('')).catch(''),
  level: levelSchema.or(z.literal('')).catch(''),
  format: courseFormatSchema.or(z.literal('')).catch(''),
  q: z.string().trim().max(50).catch(''),
})
export type CourseListQuery = z.output<typeof courseListQuerySchema>

/**
 * 기업 수강 신청 폼. 브라우저 검증 없이도 서버(Server Action)가 같은 스키마로 검증한다.
 * FormData 값은 모두 문자열이므로 인원수는 coerce, 동의 체크박스는 'on' 리터럴로 받는다.
 */
export const enrollmentFormSchema = z.object({
  courseSlug: z.string().min(1),
  name: personNameField,
  email: emailField,
  phone: mobilePhoneField,
  company: z
    .string()
    .trim()
    .min(1, '회사명을 입력하세요.')
    .max(50, '회사명은 50자 이하로 입력하세요.'),
  headcount: z.coerce
    .number({ error: '인원을 숫자로 입력하세요.' })
    .int('인원은 정수로 입력하세요.')
    .min(1, '1명 이상 입력하세요.')
    .max(30, '31명 이상은 별도 상담으로 안내드립니다.'),
  message: z.string().trim().max(500, '문의 내용은 500자 이하로 입력하세요.').default(''),
  agree: z.literal('on', { error: '개인정보 수집·이용에 동의해 주세요.' }),
})
export type EnrollmentFormValues = z.output<typeof enrollmentFormSchema>
export type EnrollmentField = keyof z.input<typeof enrollmentFormSchema>
