import type { AttendanceStatus, LessonStatus } from '@lms/api-client'
import type { BadgeTone } from '@lms/ui'

export const LESSON_STATUS_TONE: Record<LessonStatus, BadgeTone> = {
  SCHEDULED: 'brand',
  COMPLETED: 'neutral',
  CANCELED: 'danger',
}

export const ATTENDANCE_TONE: Record<AttendanceStatus, string> = {
  PRESENT: 'bg-success-700 text-white border-success-700',
  LATE: 'bg-warning-700 text-white border-warning-700',
  ABSENT: 'bg-danger-600 text-white border-danger-600',
  EXCUSED: 'bg-gray-600 text-white border-gray-600',
}
