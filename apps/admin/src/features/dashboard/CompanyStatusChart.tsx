import { STUDENT_STATUS_LABEL, type Dashboard, type StudentStatus } from '@lms/api-client'
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
import { ChartCard, DataTableSimple } from './ChartCard'
import { CHART } from './chartTheme'

type Row = Dashboard['companyBreakdown'][number]

/** 범주 → 고정 색 슬롯. 필터 등으로 계열 수가 바뀌어도 색이 재배정되지 않는다. */
const SERIES: { key: keyof Omit<Row, 'company'>; status: StudentStatus; color: string }[] = [
  { key: 'active', status: 'ACTIVE', color: CHART.series[0] },
  { key: 'paused', status: 'PAUSED', color: CHART.series[1] },
  { key: 'completed', status: 'COMPLETED', color: CHART.series[2] },
  { key: 'dropped', status: 'DROPPED', color: CHART.series[3] },
]

function Legend() {
  return (
    <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
      {SERIES.map((s) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
          {STUDENT_STATUS_LABEL[s.status]}
        </li>
      ))}
    </ul>
  )
}

function CompanyTooltip({ active, payload }: TooltipContentProps) {
  const row = payload?.[0]?.payload as Row | undefined
  if (!active || !row) return null
  const total = SERIES.reduce((sum, s) => sum + row[s.key], 0)
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-gray-900">
        {row.company} <span className="font-normal text-gray-500">총 {total}명</span>
      </p>
      <ul className="mt-1 space-y-0.5">
        {SERIES.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5 text-gray-700">
            <span aria-hidden className="size-2 rounded-sm" style={{ backgroundColor: s.color }} />
            {STUDENT_STATUS_LABEL[s.status]} <strong className="ml-auto pl-3">{row[s.key]}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function CompanyStatusChart({ data }: { data: Row[] }) {
  const sorted = [...data].sort((a, b) => b.active - a.active)
  return (
    <ChartCard
      title="고객사별 수강 현황"
      description="수강 상태별 인원 · 수강중 인원이 많은 순"
      legend={<Legend />}
      table={
        <DataTableSimple
          caption="고객사별 수강 현황"
          headers={['고객사', ...SERIES.map((s) => STUDENT_STATUS_LABEL[s.status])]}
          rows={sorted.map((row) => [row.company, ...SERIES.map((s) => row[s.key])])}
        />
      }
    >
      <ResponsiveContainer
        width="100%"
        height={sorted.length * 40 + 32}
        initialDimension={{ width: 600, height: sorted.length * 40 + 32 }}
      >
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
        >
          <CartesianGrid horizontal={false} stroke={CHART.grid} />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fill: CHART.muted, fontSize: 12 }}
            axisLine={{ stroke: CHART.axis }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="company"
            width={88}
            tick={{ fill: CHART.textSecondary, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={CompanyTooltip}
            cursor={{ fill: '#f5f5f4' }}
            isAnimationActive={false}
          />
          {SERIES.map((s, index) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              stackId="status"
              fill={s.color}
              barSize={20}
              // 세그먼트 사이 2px 흰 간격, 바깥쪽 끝만 4px 라운드
              stroke={CHART.surface}
              strokeWidth={2}
              radius={index === SERIES.length - 1 ? [0, 4, 4, 0] : 0}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
