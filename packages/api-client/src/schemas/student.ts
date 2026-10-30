import { formatPhone } from '@lms/utils'
import { z } from 'zod'
import {
  createSearchParamsCodec,
  enumArrayParam,
  pageParam,
  pageSizeParam,
  paginatedSchema,
  sortOrderSchema,
} from './common'
import { emailField, mobilePhoneField, personNameField } from './fields'

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

export const studentFormSchema = z.object({
  name: personNameField,
  email: emailField,
  phone: mobilePhoneField,
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
  // 저장 값은 숫자만이지만, 폼에는 입력할 때와 같은 하이픈 형식으로 보여준다(스키마가 다시 숫자만 남긴다).
  return {
    name,
    email,
    phone: formatPhone(phone, ''),
    company,
    department,
    level,
    status,
    enrolledAt,
    memo,
  }
}

// ──────────────────────────────────────────────
// 목록 조회 쿼리 — admin URL 쿼리 파싱과 MSW 요청 파싱에 같은 스키마를 쓴다.
// 잘못된 값은 .catch()로 기본값 대체: URL을 손으로 고쳐도 화면이 깨지지 않는다.
// ──────────────────────────────────────────────

export const STUDENT_SORT_KEYS = ['name', 'company', 'enrolledAt', 'createdAt'] as const
export type StudentSortKey = (typeof STUDENT_SORT_KEYS)[number]

export const studentListQuerySchema = z.object({
  page: pageParam,
  pageSize: pageSizeParam(10),
  sort: z.enum(STUDENT_SORT_KEYS).catch('createdAt'),
  order: sortOrderSchema.catch('desc'),
  status: enumArrayParam(STUDENT_STATUSES),
  level: enumArrayParam(LEVELS),
  company: z.string().trim().catch(''),
  q: z.string().trim().catch(''),
})
export type StudentListQuery = z.output<typeof studentListQuerySchema>

const studentListCodec = createSearchParamsCodec(studentListQuerySchema, ['status', 'level'])

export const defaultStudentListQuery: StudentListQuery = studentListCodec.defaults
/** URLSearchParams → StudentListQuery */
export const parseStudentListQuery = studentListCodec.parse
/** StudentListQuery → URLSearchParams (기본값 생략) */
export const toStudentListSearchParams = studentListCodec.serialize

// ──────────────────────────────────────────────
// CSV 일괄 등록
// ──────────────────────────────────────────────

export const studentImportRequestSchema = z.object({
  rows: z.array(z.unknown()).min(1).max(500),
})

export const studentImportResultSchema = z.object({
  createdCount: z.number().int(),
  errors: z.array(
    z.object({
      /** 요청 rows 배열의 인덱스 */
      index: z.number().int(),
      fieldErrors: z.record(z.string(), z.string()),
    }),
  ),
})
export type StudentImportResult = z.infer<typeof studentImportResultSchema>
