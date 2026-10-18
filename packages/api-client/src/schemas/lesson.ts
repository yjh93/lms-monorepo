import { z } from 'zod'
import { levelSchema } from './student'

export const ATTENDANCE_STATUSES = ['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'] as const
export const attendanceStatusSchema = z.enum(ATTENDANCE_STATUSES)
export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>

export const ATTENDANCE_STATUS_LABEL: Record<AttendanceStatus, string> = {
  PRESENT: '출석',
  LATE: '지각',
  ABSENT: '결석',
  EXCUSED: '공결',
}

export const LESSON_STATUSES = ['SCHEDULED', 'COMPLETED', 'CANCELED'] as const
export const lessonStatusSchema = z.enum(LESSON_STATUSES)
export type LessonStatus = z.infer<typeof lessonStatusSchema>

export const LESSON_STATUS_LABEL: Record<LessonStatus, string> = {
  SCHEDULED: '예정',
  COMPLETED: '완료',
  CANCELED: '휴강',
}

export const LANGUAGES = ['EN', 'JA', 'ZH'] as const
export const languageSchema = z.enum(LANGUAGES)
export type Language = z.infer<typeof languageSchema>

export const LANGUAGE_LABEL: Record<Language, string> = { EN: '영어', JA: '일본어', ZH: '중국어' }

export const attendanceSummarySchema = z.object({
  present: z.number().int(),
  late: z.number().int(),
  absent: z.number().int(),
  excused: z.number().int(),
  unmarked: z.number().int(),
})
export type AttendanceSummary = z.infer<typeof attendanceSummarySchema>

export const lessonSchema = z.object({
  id: z.string(),
  courseTitle: z.string(),
  language: languageSchema,
  teacherId: z.string(),
  teacherName: z.string(),
  company: z.string(),
  date: z.iso.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  mode: z.enum(['ONLINE', 'ONSITE']),
  status: lessonStatusSchema,
  attendance: attendanceSummarySchema,
})
export type Lesson = z.infer<typeof lessonSchema>

export const rosterEntrySchema = z.object({
  student: z.object({
    id: z.string(),
    name: z.string(),
    department: z.string(),
    level: levelSchema,
  }),
  status: attendanceStatusSchema.nullable(),
})
export type RosterEntry = z.infer<typeof rosterEntrySchema>

export const lessonDetailSchema = lessonSchema.extend({ roster: z.array(rosterEntrySchema) })
export type LessonDetail = z.infer<typeof lessonDetailSchema>

/** 주 단위 조회: week는 해당 주의 월요일(YYYY-MM-DD). 비어 있으면 서버가 이번 주로 해석한다. */
export const lessonListQuerySchema = z.object({
  week: z.iso.date().catch(''),
  teacherId: z.string().catch(''),
})
export type LessonListQuery = z.output<typeof lessonListQuerySchema>

export const lessonListResponseSchema = z.object({
  week: z.iso.date(),
  items: z.array(lessonSchema),
})

export const attendanceUpdateSchema = z.object({
  status: attendanceStatusSchema.nullable(),
})

export const teacherSchema = z.object({
  id: z.string(),
  name: z.string(),
  language: languageSchema,
})
export type Teacher = z.infer<typeof teacherSchema>
