import { z } from 'zod'
import { request } from './http'
import {
  lessonDetailSchema,
  lessonListResponseSchema,
  rosterEntrySchema,
  teacherSchema,
  type AttendanceStatus,
  type LessonListQuery,
} from './schemas/lesson'

export function fetchLessons(query: LessonListQuery, signal?: AbortSignal) {
  return request('/lessons', { query, schema: lessonListResponseSchema, signal })
}

export function fetchLesson(id: string, signal?: AbortSignal) {
  return request(`/lessons/${encodeURIComponent(id)}`, { schema: lessonDetailSchema, signal })
}

export interface UpdateAttendanceInput {
  lessonId: string
  studentId: string
  status: AttendanceStatus | null
  /** 데모용: 목 서버가 500을 반환하게 해 낙관적 업데이트 롤백을 확인한다. */
  simulateFailure?: boolean
}

export function updateAttendance({
  lessonId,
  studentId,
  status,
  simulateFailure,
}: UpdateAttendanceInput) {
  return request(
    `/lessons/${encodeURIComponent(lessonId)}/attendance/${encodeURIComponent(studentId)}`,
    {
      method: 'PUT',
      body: { status },
      query: simulateFailure ? { simulateFailure: 1 } : undefined,
      schema: rosterEntrySchema,
    },
  )
}

export function fetchTeachers(signal?: AbortSignal) {
  return request('/teachers', { schema: z.array(teacherSchema), signal })
}
