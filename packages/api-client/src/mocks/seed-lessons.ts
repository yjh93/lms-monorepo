import { addDaysISO, toISODate, weekStartOf } from '@lms/utils'
import type { AttendanceStatus, Language, Teacher } from '../schemas/lesson'
import type { Student } from '../schemas/student'
import { createRandom } from './random'

export const TEACHERS: Teacher[] = [
  { id: 'tch_01', name: 'Emily Carter', language: 'EN' },
  { id: 'tch_02', name: 'James Wilson', language: 'EN' },
  { id: 'tch_03', name: 'Sarah Lee', language: 'EN' },
  { id: 'tch_04', name: '다나카 유키', language: 'JA' },
  { id: 'tch_05', name: '왕리', language: 'ZH' },
]

const COURSE_TITLES: Record<Language, string[]> = {
  EN: ['비즈니스 영어 회화', '영어 프레젠테이션', '영문 이메일 라이팅', 'OPIc 대비'],
  JA: ['비즈니스 일본어 회화'],
  ZH: ['비즈니스 중국어 회화'],
}

/** 같은 고객사 수강생들로 구성된 반(정기 수업 단위) */
export interface LessonGroup {
  id: string
  courseTitle: string
  language: Language
  teacherId: string
  company: string
  /** 0=월 ... 4=금 */
  weekdays: [number, number]
  startTime: string
  endTime: string
  mode: 'ONLINE' | 'ONSITE'
  studentIds: string[]
}

export interface MockLesson {
  id: string
  groupId: string
  date: string
  canceled: boolean
}

const SLOTS = [
  ['08:00', '08:50'],
  ['12:10', '13:00'],
  ['18:30', '19:20'],
] as const

const WEEKDAY_PAIRS: [number, number][] = [
  [0, 2],
  [1, 3],
  [0, 3],
  [1, 4],
]

export function seedLessonGroups(students: Student[]): LessonGroup[] {
  const random = createRandom(7)
  const groups: LessonGroup[] = []
  const byCompany = new Map<string, Student[]>()
  for (const student of students) {
    if (student.status !== 'ACTIVE') continue
    byCompany.set(student.company, [...(byCompany.get(student.company) ?? []), student])
  }

  for (const [company, members] of byCompany) {
    for (let start = 0; start < members.length; start += 5) {
      const chunk = members.slice(start, start + 5)
      if (chunk.length < 2) continue
      const teacher = groups.length % 4 === 0 ? TEACHERS[0]! : random.pick(TEACHERS)
      const slot = random.pick(SLOTS)
      groups.push({
        id: `grp_${String(groups.length + 1).padStart(2, '0')}`,
        courseTitle: random.pick(COURSE_TITLES[teacher.language]),
        language: teacher.language,
        teacherId: teacher.id,
        company,
        weekdays: random.pick(WEEKDAY_PAIRS),
        startTime: slot[0],
        endTime: slot[1],
        mode: random.next() < 0.6 ? 'ONLINE' : 'ONSITE',
        studentIds: chunk.map((s) => s.id),
      })
    }
  }
  return groups
}

/**
 * 오늘 기준 과거 8주 ~ 미래 4주의 수업을 만든다.
 * "오늘"에 맞춰 생성하므로 언제 데모를 열어도 이번 주 수업과 지난 출석 기록이 있다.
 */
export function seedLessons(groups: LessonGroup[], today: Date) {
  const random = createRandom(11)
  const thisWeek = weekStartOf(today)
  const todayISO = toISODate(today)
  const lessons: MockLesson[] = []
  const attendance = new Map<string, Map<string, AttendanceStatus | null>>()

  for (let week = -8; week <= 4; week++) {
    const weekStart = addDaysISO(thisWeek, week * 7)
    for (const group of groups) {
      for (const weekday of group.weekdays) {
        const date = addDaysISO(weekStart, weekday)
        const lesson: MockLesson = {
          id: `les_${group.id.slice(4)}_${date.replaceAll('-', '')}`,
          groupId: group.id,
          date,
          canceled: random.next() < 0.03,
        }
        lessons.push(lesson)

        const isPast = date < todayISO
        attendance.set(
          lesson.id,
          new Map(
            group.studentIds.map((studentId) => [
              studentId,
              isPast && !lesson.canceled ? randomAttendance(random.next()) : null,
            ]),
          ),
        )
      }
    }
  }

  lessons.sort((a, b) => a.date.localeCompare(b.date) || a.groupId.localeCompare(b.groupId))
  return { lessons, attendance }
}

function randomAttendance(roll: number): AttendanceStatus {
  if (roll < 0.8) return 'PRESENT'
  if (roll < 0.89) return 'LATE'
  if (roll < 0.96) return 'ABSENT'
  return 'EXCUSED'
}
