import {
  LEVEL_LABEL,
  LEVELS,
  STUDENT_STATUS_LABEL,
  STUDENT_STATUSES,
  type StudentStatus,
} from '@lms/api-client'
import type { BadgeTone } from '@lms/ui'

export const STATUS_TONE: Record<StudentStatus, BadgeTone> = {
  ACTIVE: 'success',
  PAUSED: 'warning',
  COMPLETED: 'brand',
  DROPPED: 'danger',
}

export const statusOptions = STUDENT_STATUSES.map((value) => ({
  value,
  label: STUDENT_STATUS_LABEL[value],
}))

export const levelOptions = LEVELS.map((value) => ({ value, label: LEVEL_LABEL[value] }))
