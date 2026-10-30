import { ATTENDANCE_STATUS_LABEL, type AttendanceStatus } from '@lms/api-client'
import { formatNumber } from '@lms/utils'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import { ChartCard, DataTableSimple } from '../dashboard/ChartCard'
import { CHART } from '../dashboard/chartTheme'
import type { Aggregate } from './engine/types'

type Month = Aggregate['monthly'][number]
type Key = 'present' | 'absent' | 'excused' | 'late'

/** 누적 순서 = 검증된 범주형 색 순서(인접 쌍 기준). 범례도 같은 순서로 보여준다. */
const SERIES: { key: Key; status: AttendanceStatus; color: string }[] = [
  { key: 'present', status: 'PRESENT', color: CHART.series[0] },
  { key: 'absent', status: 'ABSENT', color: CHART.series[1] },
  { key: 'excused', status: 'EXCUSED', color: CHART.series[2] },
  { key: 'late', status: 'LATE', color: CHART.series[3] },
]

const monthLabel = (month: string) => `${Number(month.slice(5))}월`
const compact = (n: number) => (n >= 1000 ? `${Math.round(n / 100) / 10}K` : String(n))

function MonthTooltip({ active, payload }: TooltipContentProps) {
  const month = payload?.[0]?.payload as Month | undefined
  if (!active || !month) return null
  const total = SERIES.reduce((sum, s) => sum + month[s.key], 0)
  return (
    <div className="shadow-floating rounded-xl bg-white px-3.5 py-2.5 text-[13px]">
      <p className="font-medium text-gray-900">
        {month.month} <span className="font-normal text-gray-500">{formatNumber(total)}건</span>
      </p>
      <ul className="mt-1 space-y-0.5">
        {SERIES.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5 text-gray-700">
            <span aria-hidden className="size-2 rounded-sm" style={{ backgroundColor: s.color }} />
            {ATTENDANCE_STATUS_LABEL[s.status]}
            <strong className="ml-auto pl-3">{formatNumber(month[s.key])}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function MonthlyStatusChart({ data }: { data: Month[] }) {
  return (
    <ChartCard
      title="월별 출석 기록"
      description="출석 상태별 건수"
      legend={
        <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-gray-600">
          {SERIES.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="size-2.5 rounded-sm"
                style={{ backgroundColor: s.color }}
              />
              {ATTENDANCE_STATUS_LABEL[s.status]}
            </li>
          ))}
        </ul>
      }
      table={
        <DataTableSimple
          caption="월별 출석 기록"
          headers={['월', ...SERIES.map((s) => ATTENDANCE_STATUS_LABEL[s.status])]}
          rows={data.map((m) => [m.month, ...SERIES.map((s) => m[s.key])])}
        />
      }
    >
      <ResponsiveContainer width="100%" height={260} initialDimension={{ width: 600, height: 260 }}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={CHART.grid} />
          <XAxis
            dataKey="month"
            tickFormatter={monthLabel}
            tick={{ fill: CHART.muted, fontSize: 12 }}
            axisLine={{ stroke: CHART.axis }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={compact}
            tick={{ fill: CHART.muted, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip content={MonthTooltip} cursor={{ fill: '#f2f4f6' }} isAnimationActive={false} />
          {SERIES.map((s, index) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              stackId="status"
              fill={s.color}
              maxBarSize={24}
              stroke={CHART.surface}
              strokeWidth={2}
              radius={index === SERIES.length - 1 ? [4, 4, 0, 0] : 0}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
