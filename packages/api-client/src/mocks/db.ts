import type { AuditLog } from '../schemas/audit'
import type { AuthUser } from '../schemas/auth'
import type { AttendanceStatus } from '../schemas/lesson'
import type { Student, StudentFormValues } from '../schemas/student'
import {
  seedLessonGroups,
  seedLessons,
  TEACHERS,
  type LessonGroup,
  type MockLesson,
} from './seed-lessons'
import { COMPANIES, seedStudents } from './seed-students'

export { COMPANIES, TEACHERS }

/** 역할별 데모 계정. 로그인 시 선택한 역할의 계정으로 접속한다. */
export const DEMO_USERS: AuthUser[] = [
  { id: 'usr_admin', name: '김관리', email: 'admin@lms.dev', role: 'ADMIN', teacherId: null },
  {
    id: 'usr_manager',
    name: '이매니저',
    email: 'manager@lms.dev',
    role: 'MANAGER',
    teacherId: null,
  },
  {
    id: 'usr_teacher',
    name: 'Emily Carter',
    email: 'emily@lms.dev',
    role: 'TEACHER',
    teacherId: 'tch_01',
  },
]

/** 브라우저/테스트 세션 동안 유지되는 인메모리 DB */
export interface MockDb {
  students: Student[]
  sequence: number
  groups: LessonGroup[]
  lessons: MockLesson[]
  /** lessonId → (studentId → 출석 상태) */
  attendance: Map<string, Map<string, AttendanceStatus | null>>
  auditLogs: AuditLog[]
  auditSequence: number
}

export const db: MockDb = {
  students: [],
  sequence: 0,
  groups: [],
  lessons: [],
  attendance: new Map(),
  auditLogs: [],
  auditSequence: 0,
}

export function resetMockDb(today = new Date()) {
  db.students = seedStudents(137)
  db.sequence = db.students.length
  db.groups = seedLessonGroups(db.students)
  const { lessons, attendance } = seedLessons(db.groups, today)
  db.lessons = lessons
  db.attendance = attendance
  db.auditLogs = []
  db.auditSequence = 0
}

resetMockDb()

export function insertStudent(values: StudentFormValues, now = new Date()): Student {
  db.sequence += 1
  const timestamp = now.toISOString()
  const student: Student = {
    id: `stu_${String(db.sequence).padStart(4, '0')}`,
    ...values,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  db.students.unshift(student)
  return student
}

export function appendAuditLog(entry: Omit<AuditLog, 'id' | 'at'>, now = new Date()): AuditLog {
  db.auditSequence += 1
  const log: AuditLog = {
    id: `aud_${String(db.auditSequence).padStart(5, '0')}`,
    at: now.toISOString(),
    ...entry,
  }
  db.auditLogs.unshift(log)
  return log
}
