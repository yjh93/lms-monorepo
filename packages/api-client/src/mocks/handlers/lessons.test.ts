import { toISODate, weekStartOf } from '@lms/utils'
import { describe, expect, it } from 'vitest'
import { fetchAuditLogs } from '../../audit'
import { fetchDashboard } from '../../dashboard'
import { fetchLesson, fetchLessons, updateAttendance } from '../../lessons'
import { defaultAuditLogQuery } from '../../schemas/audit'
import { loginAs, setupMockServer } from '../../test/mockServer'
import { db } from '../db'

setupMockServer()

const today = toISODate(new Date())

/** 오늘 이전에 진행된(휴강 아님) 수업 */
function pastLesson(teacherId?: string) {
  return db.lessons.find((lesson) => {
    const group = db.groups.find((g) => g.id === lesson.groupId)!
    return lesson.date < today && !lesson.canceled && (!teacherId || group.teacherId === teacherId)
  })!
}

describe('lessons mock API', () => {
  it('week를 생략하면 이번 주(월~일) 수업을 돌려준다', async () => {
    const result = await fetchLessons({ week: '', teacherId: '' })
    expect(result.week).toBe(weekStartOf(new Date()))
    expect(result.items.length).toBeGreaterThan(0)
    for (const lesson of result.items) expect(weekStartOf(lesson.date)).toBe(result.week)
  })

  it('TEACHER는 다른 강사를 지정해도 본인 수업만 받는다(행 수준 권한)', async () => {
    loginAs('TEACHER')
    const result = await fetchLessons({ week: '', teacherId: 'tch_02' })
    expect(result.items.length).toBeGreaterThan(0)
    expect(new Set(result.items.map((l) => l.teacherId))).toEqual(new Set(['tch_01']))
  })

  it('TEACHER가 다른 강사의 수업 상세를 요청하면 403', async () => {
    const other = db.lessons.find(
      (l) => db.groups.find((g) => g.id === l.groupId)!.teacherId !== 'tch_01',
    )!
    loginAs('TEACHER')
    expect((await fetchLesson(other.id).catch((e) => e)).status).toBe(403)
  })

  it('출석 변경은 명단에 반영되고 감사 로그를 남긴다', async () => {
    const lesson = pastLesson()
    const detail = await fetchLesson(lesson.id)
    const target = detail.roster[0]!
    const next = target.status === 'ABSENT' ? 'PRESENT' : 'ABSENT'

    await updateAttendance({ lessonId: lesson.id, studentId: target.student.id, status: next })

    const updated = await fetchLesson(lesson.id)
    expect(updated.roster[0]!.status).toBe(next)
    const logs = await fetchAuditLogs({ ...defaultAuditLogQuery, action: ['ATTENDANCE_CHANGED'] })
    expect(logs.total).toBe(1)
    expect(logs.items[0]!.changes[0]!.to).toBe(next === 'ABSENT' ? '결석' : '출석')
  })

  it('미래 수업은 409, 실패 시뮬레이션은 500', async () => {
    const future = db.lessons.find((l) => l.date > today && !l.canceled)!
    const studentId = [...db.attendance.get(future.id)!.keys()][0]!
    const conflict = await updateAttendance({
      lessonId: future.id,
      studentId,
      status: 'PRESENT',
    }).catch((e) => e)
    expect(conflict.status).toBe(409)

    const lesson = pastLesson()
    const failure = await updateAttendance({
      lessonId: lesson.id,
      studentId: [...db.attendance.get(lesson.id)!.keys()][0]!,
      status: 'LATE',
      simulateFailure: true,
    }).catch((e) => e)
    expect(failure.status).toBe(500)
  })
})

describe('dashboard / audit RBAC', () => {
  it('대시보드는 출석률 0~1, 상태별 합계가 전체 수강생 수와 같다', async () => {
    const dashboard = await fetchDashboard()
    expect(dashboard.kpis.attendanceRate).toBeGreaterThan(0.5)
    expect(dashboard.kpis.attendanceRate).toBeLessThanOrEqual(1)
    expect(dashboard.statusBreakdown.reduce((sum, s) => sum + s.count, 0)).toBe(
      dashboard.kpis.totalStudents,
    )
    expect(dashboard.attendanceTrend).toHaveLength(8)
  })

  it('MANAGER는 감사 로그 403, TEACHER는 대시보드 403', async () => {
    loginAs('MANAGER')
    expect((await fetchAuditLogs(defaultAuditLogQuery).catch((e) => e)).status).toBe(403)
    loginAs('TEACHER')
    expect((await fetchDashboard().catch((e) => e)).status).toBe(403)
  })
})
