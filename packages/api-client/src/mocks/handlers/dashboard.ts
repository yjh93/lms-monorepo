import { addDaysISO, toISODate, weekStartOf } from '@lms/utils'
import { delay, http, HttpResponse } from 'msw'
import type { Dashboard } from '../../schemas/dashboard'
import { STUDENT_STATUSES } from '../../schemas/student'
import { db } from '../db'
import { api, authorize } from '../http-utils'
import { summarize } from './lessons'

function attendanceRate(summary: { present: number; late: number; marked: number }) {
  return summary.marked === 0 ? 0 : (summary.present + summary.late) / summary.marked
}

export function buildDashboard(today = new Date()): Dashboard {
  const thisWeek = weekStartOf(today)
  const todayISO = toISODate(today)

  // 지난 8주(이번 주 제외) 주별 출석 집계
  const attendanceTrend = Array.from({ length: 8 }, (_, i) => {
    const weekStart = addDaysISO(thisWeek, (i - 8) * 7)
    const weekEnd = addDaysISO(weekStart, 6)
    const totals = { present: 0, late: 0, absent: 0, excused: 0 }
    for (const lesson of db.lessons) {
      if (lesson.canceled || lesson.date < weekStart || lesson.date > weekEnd) continue
      const summary = summarize(db.attendance.get(lesson.id))
      totals.present += summary.present
      totals.late += summary.late
      totals.absent += summary.absent
      totals.excused += summary.excused
    }
    const marked = totals.present + totals.late + totals.absent + totals.excused
    return { weekStart, rate: attendanceRate({ ...totals, marked }), ...totals }
  })

  const rateOf = (weeks: typeof attendanceTrend) => {
    const sum = weeks.reduce(
      (acc, w) => ({
        present: acc.present + w.present,
        late: acc.late + w.late,
        marked: acc.marked + w.present + w.late + w.absent + w.excused,
      }),
      { present: 0, late: 0, marked: 0 },
    )
    return attendanceRate(sum)
  }
  const recent = rateOf(attendanceTrend.slice(4))
  const previous = rateOf(attendanceTrend.slice(0, 4))

  const companies = [...new Set(db.students.map((s) => s.company))].sort()

  return {
    kpis: {
      totalStudents: db.students.length,
      activeStudents: db.students.filter((s) => s.status === 'ACTIVE').length,
      lessonsThisWeek: db.lessons.filter(
        (l) => !l.canceled && l.date >= thisWeek && l.date <= addDaysISO(thisWeek, 6),
      ).length,
      attendanceRate: recent,
      attendanceRateDelta: recent - previous,
    },
    attendanceTrend: attendanceTrend.filter((w) => w.weekStart <= todayISO),
    statusBreakdown: STUDENT_STATUSES.map((status) => ({
      status,
      count: db.students.filter((s) => s.status === status).length,
    })),
    companyBreakdown: companies.map((company) => {
      const members = db.students.filter((s) => s.company === company)
      const count = (status: string) => members.filter((s) => s.status === status).length
      return {
        company,
        active: count('ACTIVE'),
        paused: count('PAUSED'),
        completed: count('COMPLETED'),
        dropped: count('DROPPED'),
      }
    }),
  }
}

export const dashboardHandlers = [
  http.get(api('/dashboard'), async ({ request }) => {
    await delay()
    const actor = authorize(request, 'dashboard:read')
    if (actor instanceof Response) return actor
    return HttpResponse.json(buildDashboard())
  }),
]
