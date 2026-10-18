import { z } from 'zod'
import { studentStatusSchema } from './student'

export const dashboardSchema = z.object({
  kpis: z.object({
    totalStudents: z.number().int(),
    activeStudents: z.number().int(),
    lessonsThisWeek: z.number().int(),
    /** 최근 4주 출석률(출석+지각 / 체크된 인원), 0~1 */
    attendanceRate: z.number().min(0).max(1),
    /** 직전 4주 대비 출석률 변화(퍼센트포인트 비율, 예: 0.021 = +2.1%p) */
    attendanceRateDelta: z.number(),
  }),
  /** 주별 출석률 추이 (오래된 주 → 최근 주) */
  attendanceTrend: z.array(
    z.object({
      weekStart: z.iso.date(),
      rate: z.number().min(0).max(1),
      present: z.number().int(),
      late: z.number().int(),
      absent: z.number().int(),
      excused: z.number().int(),
    }),
  ),
  statusBreakdown: z.array(z.object({ status: studentStatusSchema, count: z.number().int() })),
  /** 고객사별 수강 현황 */
  companyBreakdown: z.array(
    z.object({
      company: z.string(),
      active: z.number().int(),
      paused: z.number().int(),
      completed: z.number().int(),
      dropped: z.number().int(),
    }),
  ),
})
export type Dashboard = z.infer<typeof dashboardSchema>
