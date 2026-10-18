import type { Dashboard } from '@lms/api-client'
import { formatPercent } from '@lms/utils'
import {
  Area,
  AreaChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import { ChartCard, DataTableSimple } from './ChartCard'
import { CHART } from './chartTheme'

type Week = Dashboard['attendanceTrend'][number]

const weekLabel = (weekStart: string) => {
  const [, month, day] = weekStart.split('-').map(Number)
  return `${month}/${day}주`
}

function TrendTooltip({ active, payload }: TooltipContentProps) {
  const week = payload?.[0]?.payload as Week | undefined
  if (!active || !week) return null
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-gray-900">{weekLabel(week.weekStart)} 시작</p>
      <p className="mt-1 text-gray-900">
        출석률 <strong>{formatPercent(week.rate)}</strong>
      </p>
      <p className="mt-0.5 text-gray-500">
        출석 {week.present} · 지각 {week.late} · 결석 {week.absent} · 공결 {week.excused}
      </p>
    </div>
  )
}

export function AttendanceTrendChart({ data }: { data: Week[] }) {
  const last = data.length - 1
  return (
    <ChartCard
      title="주간 출석률 추이"
      description="최근 8주 · (출석 + 지각) ÷ 체크된 인원"
      table={
        <DataTableSimple
          caption="주간 출석률"
          headers={['주 시작일', '출석률', '출석', '지각', '결석', '공결']}
          rows={data.map((w) => [
            w.weekStart,
            formatPercent(w.rate),
            w.present,
            w.late,
            w.absent,
            w.excused,
          ])}
        />
      }
    >
      <ResponsiveContainer width="100%" height={240} initialDimension={{ width: 600, height: 240 }}>
        <AreaChart data={data} margin={{ top: 24, right: 56, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={CHART.grid} />
          <XAxis
            dataKey="weekStart"
            tickFormatter={weekLabel}
            padding={{ left: 16, right: 8 }}
            tickMargin={6}
            tick={{ fill: CHART.muted, fontSize: 12 }}
            axisLine={{ stroke: CHART.axis }}
            tickLine={false}
          />
          <YAxis
            domain={[0.6, 1]}
            ticks={[0.6, 0.7, 0.8, 0.9, 1]}
            tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
            tick={{ fill: CHART.muted, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip
            content={TrendTooltip}
            cursor={{ stroke: CHART.axis, strokeWidth: 1 }}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="rate"
            stroke={CHART.series[0]}
            strokeWidth={2}
            fill={CHART.series[0]}
            fillOpacity={0.1}
            dot={false}
            activeDot={{ r: 5, stroke: CHART.surface, strokeWidth: 2, fill: CHART.series[0] }}
            isAnimationActive={false}
          >
            {/* 최근 주 값만 끝점에 직접 표기(모든 점에 숫자를 달지 않는다) */}
            <LabelList
              dataKey="rate"
              content={({ x, y, value, index }) =>
                index === last ? (
                  <text
                    x={Number(x) + 8}
                    y={Number(y) - 8}
                    fill={CHART.textPrimary}
                    fontSize={12}
                    fontWeight={600}
                  >
                    {formatPercent(Number(value))}
                  </text>
                ) : null
              }
            />
          </Area>
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
