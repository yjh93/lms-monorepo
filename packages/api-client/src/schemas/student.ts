import { z } from 'zod'
import { enumArrayParam, PAGE_SIZES, paginatedSchema, sortOrderSchema } from './common'

// ──────────────────────────────────────────────
// 도메인 enum
// ──────────────────────────────────────────────

export const STUDENT_STATUSES = ['ACTIVE', 'PAUSED', 'COMPLETED', 'DROPPED'] as const
export const studentStatusSchema = z.enum(STUDENT_STATUSES)
export type StudentStatus = z.infer<typeof studentStatusSchema>

export const STUDENT_STATUS_LABEL: Record<StudentStatus, string> = {
  ACTIVE: '수강중',
  PAUSED: '휴강',
  COMPLETED: '수료',
  DROPPED: '중도포기',
}

export const LEVELS = ['BEGINNER', 'ELEMENTARY', 'INTERMEDIATE', 'UPPER', 'ADVANCED'] as const
export const levelSchema = z.enum(LEVELS)
export type Level = z.infer<typeof levelSchema>

export const LEVEL_LABEL: Record<Level, string> = {
  BEGINNER: '입문',
  ELEMENTARY: '초급',
  INTERMEDIATE: '중급',
  UPPER: '중상급',
  ADVANCED: '고급',
}

// ──────────────────────────────────────────────
// 엔티티
// ──────────────────────────────────────────────

export const studentSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  phone: z.string(),
  company: z.string(),
  department: z.string(),
  level: levelSchema,
  status: studentStatusSchema,
  enrolledAt: z.iso.date(),
  memo: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})
export type Student = z.infer<typeof studentSchema>

export const studentListResponseSchema = paginatedSchema(studentSchema)

// ──────────────────────────────────────────────
// 등록/수정 폼 — admin 폼(react-hook-form)과 MSW(서버 검증)가 같은 스키마를 쓴다.
// ──────────────────────────────────────────────

const PHONE_PATTERN = /^01[016789]\d{7,8}$/

export const studentFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, '이름은 2자 이상 입력하세요.')
    .max(20, '이름은 20자 이하로 입력하세요.'),
  email: z.string().trim().toLowerCase().pipe(z.email('이메일 형식이 올바르지 않습니다.')),
  // 입력은 "010-1234-5678"도 허용하고, 저장 값은 숫자만 남긴다(입력 타입 ≠ 출력 타입).
  phone: z
    .string()
    .trim()
    .transform((value) => value.replace(/-/g, ''))
    .pipe(z.string().regex(PHONE_PATTERN, '휴대폰 번호 형식이 올바르지 않습니다.')),
  company: z.string().trim().min(1, '고객사를 입력하세요.').max(50),
  department: z.string().trim().max(50, '부서는 50자 이하로 입력하세요.'),
  level: levelSchema,
  status: studentStatusSchema,
  enrolledAt: z.iso.date('수강 시작일을 선택하세요.'),
  memo: z.string().trim().max(200, '메모는 200자 이하로 입력하세요.'),
})

/** 폼에 입력되는 값의 타입(변환 전) */
export type StudentFormInput = z.input<typeof studentFormSchema>
/** 검증·변환이 끝나 API로 전송되는 값의 타입 */
export type StudentFormValues = z.output<typeof studentFormSchema>

export const studentFormDefaults: StudentFormInput = {
  name: '',
  email: '',
  phone: '',
  company: '',
  department: '',
  level: 'BEGINNER',
  status: 'ACTIVE',
  enrolledAt: '',
  memo: '',
}

export function toStudentFormInput(student: Student): StudentFormInput {
  const { name, email, phone, company, department, level, status, enrolledAt, memo } = student
  return { name, email, phone, company, department, level, status, enrolledAt, memo }
}

// ──────────────────────────────────────────────
// 목록 조회 쿼리 — admin URL 쿼리 파싱과 MSW 요청 파싱에 같은 스키마를 쓴다.
// 잘못된 값은 .catch()로 기본값 대체: URL을 손으로 고쳐도 화면이 깨지지 않는다.
// ──────────────────────────────────────────────

export const STUDENT_SORT_KEYS = ['name', 'company', 'enrolledAt', 'createdAt'] as const
export type StudentSortKey = (typeof STUDENT_SORT_KEYS)[number]

export const studentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce
    .number()
    .refine((v): v is (typeof PAGE_SIZES)[number] => (PAGE_SIZES as readonly number[]).includes(v))
    .catch(10),
  sort: z.enum(STUDENT_SORT_KEYS).catch('createdAt'),
  order: sortOrderSchema.catch('desc'),
  status: enumArrayParam(STUDENT_STATUSES),
  level: enumArrayParam(LEVELS),
  company: z.string().trim().catch(''),
  q: z.string().trim().catch(''),
})
export type StudentListQuery = z.output<typeof studentListQuerySchema>

export const defaultStudentListQuery: StudentListQuery = studentListQuerySchema.parse({})

const ARRAY_KEYS = ['status', 'level'] as const satisfies ReadonlyArray<keyof StudentListQuery>

/** URLSearchParams → StudentListQuery (배열 키는 getAll로 수집) */
export function parseStudentListQuery(params: URLSearchParams): StudentListQuery {
  const raw: Record<string, unknown> = Object.fromEntries(params)
  for (const key of ARRAY_KEYS) raw[key] = params.getAll(key)
  return studentListQuerySchema.parse(raw)
}

/** StudentListQuery → URLSearchParams. 기본값과 같은 항목은 생략해 URL을 짧게 유지한다. */
export function toStudentListSearchParams(query: Partial<StudentListQuery>): URLSearchParams {
  const params = new URLSearchParams()
  const merged = { ...defaultStudentListQuery, ...query }
  for (const [key, value] of Object.entries(merged)) {
    const defaultValue = defaultStudentListQuery[key as keyof StudentListQuery]
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, String(item))
    } else if (value !== defaultValue && value !== '') {
      params.set(key, String(value))
    }
  }
  return params
}
