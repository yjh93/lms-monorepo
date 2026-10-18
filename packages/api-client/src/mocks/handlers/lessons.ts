import { addDaysISO, toISODate, weekStartOf } from '@lms/utils'
import { delay, http, HttpResponse } from 'msw'
import type { AuthUser } from '../../schemas/auth'
import {
  ATTENDANCE_STATUS_LABEL,
  attendanceUpdateSchema,
  lessonListQuerySchema,
  type AttendanceStatus,
  type AttendanceSummary,
  type Lesson,
  type LessonDetail,
} from '../../schemas/lesson'
import { appendAuditLog, db, TEACHERS } from '../db'
import { api, authorize, errorResponse, toActor } from '../http-utils'
import type { MockLesson } from '../seed-lessons'

export function summarize(
  records: Map<string, AttendanceStatus | null> | undefined,
): AttendanceSummary {
  const summary = { present: 0, late: 0, absent: 0, excused: 0, unmarked: 0 }
  for (const status of records?.values() ?? []) {
    if (status === null) summary.unmarked += 1
    else summary[status.toLowerCase() as Exclude<keyof AttendanceSummary, 'unmarked'>] += 1
  }
  return summary
}

export function toLesson(lesson: MockLesson, today = toISODate(new Date())): Lesson {
  const group = db.groups.find((g) => g.id === lesson.groupId)!
  const teacher = TEACHERS.find((t) => t.id === group.teacherId)!
  return {
    id: lesson.id,
    courseTitle: group.courseTitle,
    language: group.language,
    teacherId: teacher.id,
    teacherName: teacher.name,
    company: group.company,
    date: lesson.date,
    startTime: group.startTime,
    endTime: group.endTime,
    mode: group.mode,
    status: lesson.canceled ? 'CANCELED' : lesson.date < today ? 'COMPLETED' : 'SCHEDULED',
    attendance: summarize(db.attendance.get(lesson.id)),
  }
}

function toLessonDetail(lesson: MockLesson): LessonDetail {
  const records = db.attendance.get(lesson.id) ?? new Map()
  const roster = [...records.entries()].flatMap(([studentId, status]) => {
    const student = db.students.find((s) => s.id === studentId)
    if (!student) return []
    const { id, name, department, level } = student
    return [{ student: { id, name, department, level }, status }]
  })
  return { ...toLesson(lesson), roster }
}

/** TEACHER는 본인 수업만 접근할 수 있다(행 수준 권한). */
function canAccessLesson(user: AuthUser, lesson: MockLesson) {
  if (user.role !== 'TEACHER') return true
  return db.groups.find((g) => g.id === lesson.groupId)?.teacherId === user.teacherId
}

export const lessonHandlers = [
  http.get(api('/lessons'), async ({ request }) => {
    await delay()
    const actor = authorize(request, 'lesson:read')
    if (actor instanceof Response) return actor

    const raw = Object.fromEntries(new URL(request.url).searchParams)
    const query = lessonListQuerySchema.parse(raw)
    const week = query.week ? weekStartOf(query.week) : weekStartOf(new Date())
    const weekEnd = addDaysISO(week, 6)
    const teacherId = actor.role === 'TEACHER' ? actor.teacherId : query.teacherId

    const items = db.lessons
      .filter((lesson) => lesson.date >= week && lesson.date <= weekEnd)
      .map((lesson) => toLesson(lesson))
      .filter((lesson) => !teacherId || lesson.teacherId === teacherId)
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))

    return HttpResponse.json({ week, items })
  }),

  http.get(api('/lessons/:id'), async ({ params, request }) => {
    await delay()
    const actor = authorize(request, 'lesson:read')
    if (actor instanceof Response) return actor

    const lesson = db.lessons.find((l) => l.id === params.id)
    if (!lesson) return errorResponse(404, { message: '수업을 찾을 수 없습니다.' })
    if (!canAccessLesson(actor, lesson)) {
      return errorResponse(403, { message: '담당 수업만 조회할 수 있습니다.' })
    }
    return HttpResponse.json(toLessonDetail(lesson))
  }),

  http.put(api('/lessons/:id/attendance/:studentId'), async ({ params, request }) => {
    await delay()
    const actor = authorize(request, 'attendance:check')
    if (actor instanceof Response) return actor

    if (new URL(request.url).searchParams.has('simulateFailure')) {
      return errorResponse(500, { message: '일시적인 서버 오류로 저장하지 못했습니다.' })
    }

    const lesson = db.lessons.find((l) => l.id === params.id)
    if (!lesson) return errorResponse(404, { message: '수업을 찾을 수 없습니다.' })
    if (!canAccessLesson(actor, lesson)) {
      return errorResponse(403, { message: '담당 수업만 출석 체크할 수 있습니다.' })
    }
    if (lesson.canceled) return errorResponse(409, { message: '휴강한 수업입니다.' })
    if (lesson.date > toISODate(new Date())) {
      return errorResponse(409, { message: '아직 진행하지 않은 수업입니다.' })
    }

    const records = db.attendance.get(lesson.id)
    const studentId = String(params.studentId)
    if (!records?.has(studentId)) {
      return errorResponse(404, { message: '수업 명단에 없는 수강생입니다.' })
    }

    const parsed = attendanceUpdateSchema.safeParse(await request.json())
    if (!parsed.success) return errorResponse(422, { message: '출석 상태가 올바르지 않습니다.' })

    const previous = records.get(studentId) ?? null
    const next = parsed.data.status
    records.set(studentId, next)

    const student = db.students.find((s) => s.id === studentId)!
    if (previous !== next) {
      const label = (status: AttendanceStatus | null) =>
        status ? ATTENDANCE_STATUS_LABEL[status] : '미체크'
      const detail = toLesson(lesson)
      appendAuditLog({
        actor: toActor(actor),
        action: 'ATTENDANCE_CHANGED',
        target: { type: 'LESSON', id: lesson.id, label: `${detail.courseTitle} ${lesson.date}` },
        summary: `${student.name} 수강생 출석을 ${label(next)}(으)로 변경했습니다.`,
        changes: [{ field: 'attendance', label: '출석', from: label(previous), to: label(next) }],
      })
    }

    const { id, name, department, level } = student
    return HttpResponse.json({ student: { id, name, department, level }, status: next })
  }),

  http.get(api('/teachers'), async ({ request }) => {
    await delay()
    const actor = authorize(request, 'lesson:read')
    if (actor instanceof Response) return actor
    return HttpResponse.json(TEACHERS)
  }),
]
