import type { AttendanceStatus, LessonStatus } from '@lms/api-client'
import type { BadgeTone } from '@lms/ui'

export const LESSON_STATUS_TONE: Record<LessonStatus, BadgeTone> = {
  SCHEDULED: 'brand',
  COMPLETED: 'neutral',
  CANCELED: 'danger',
}

export const ATTENDANCE_TONE: Record<AttendanceStatus, string> = {
  PRESENT: 'bg-white text-success-700 shadow-sm',
  LATE: 'bg-white text-warning-700 shadow-sm',
  ABSENT: 'bg-white text-danger-600 shadow-sm',
  EXCUSED: 'bg-white text-gray-800 shadow-sm',
}
