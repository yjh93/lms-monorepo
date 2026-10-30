import { ATTENDANCE_STATUS_LABEL } from '@lms/api-client'
import { formatNumber, formatPercent } from '@lms/utils'
import { PageHeader } from '../../components/PageHeader'
import { AnalyticsFilterBar } from './AnalyticsFilterBar'
import { useAggregate, useDatasetInfo } from './analyticsQueries'
import { useAnalyticsStore } from './analyticsStore'
import { AttendanceHeatmap } from './AttendanceHeatmap'
import { AttendanceLogTable } from './AttendanceLogTable'
import { CompanyRateBars } from './CompanyRateBars'
import { slotLabel } from './engine/dataset'
import { WEEKDAY_LABEL } from './engine/types'
import { MonthlyStatusChart } from './MonthlyStatusChart'

function Tile({ label, value, caption }: { label: string; value: string; caption?: string }) {
  return (
    <div className="rounded-card bg-white p-6">
      <dt className="text-[15px] font-medium text-gray-600">{label}</dt>
      <dd className="mt-3 text-[28px] leading-none font-bold tracking-[-0.02em] text-gray-900 tabular-nums">
        {value}
      </dd>
      {caption && <dd className="mt-3 text-[13px] text-gray-500">{caption}</dd>}
    </div>
  )
}

export function AnalyticsPage() {
  const info = useDatasetInfo()
  const filters = useAnalyticsStore((s) => s.filters)
  const toggleCell = useAnalyticsStore((s) => s.toggleCell)
  const aggregate = useAggregate(filters)

  const sizeMb = info.data ? (info.data.bytes / 1024 / 1024).toFixed(1) : null

  return (
    <>
      <PageHeader
        title="출석 분석"
        description={
          info.data
            ? `최근 1년 출석 기록 ${formatNumber(info.data.size)}건 · 메모리 ${sizeMb}MB(열 단위 TypedArray) · 웹 워커에서 생성 ${formatNumber(info.data.generatedMs)}ms`
            : '분석 데이터를 준비하는 중…'
        }
      />

      {info.data && <AnalyticsFilterBar companies={info.data.companies} />}

      {filters.cell && (
        <div className="bg-brand-50 text-brand-600 mb-4 flex items-center justify-between rounded-2xl px-5 py-3 text-[14px] font-medium">
          <span>
            {WEEKDAY_LABEL[filters.cell.weekday]}요일 {slotLabel(filters.cell.slot)} 수업만 보는 중
          </span>
          <button
            type="button"
            onClick={() => toggleCell(filters.cell!)}
            className="rounded-lg px-2 py-1 hover:bg-white/60"
          >
            해제
          </button>
        </div>
      )}

      {!aggregate.data ? (
        <p className="rounded-card bg-white py-20 text-center text-gray-500">
          {aggregate.isError ? aggregate.error.message : '집계하는 중…'}
        </p>
      ) : (
        <div className={aggregate.isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
          <dl className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Tile
              label="조건에 맞는 기록"
              value={`${formatNumber(aggregate.data.matched)}건`}
              caption={`전체 ${formatNumber(aggregate.data.total)}건 중 ${formatPercent(aggregate.data.matched / aggregate.data.total)}`}
            />
            <Tile
              label="출석률"
              value={formatPercent(aggregate.data.rate)}
              caption="(출석 + 지각) ÷ 전체"
            />
            <Tile
              label={`${ATTENDANCE_STATUS_LABEL.ABSENT} 건수`}
              value={formatNumber(aggregate.data.counts.ABSENT)}
              caption={`${ATTENDANCE_STATUS_LABEL.EXCUSED} ${formatNumber(aggregate.data.counts.EXCUSED)}건 별도`}
            />
            <Tile
              label="집계 시간"
              value={`${aggregate.data.elapsedMs}ms`}
              caption="필터 + 집계, 웹 워커에서 계산"
            />
          </dl>

          <div className="mb-4">
            <AttendanceHeatmap cells={aggregate.data.heatmap} />
          </div>
          <div className="mb-4 grid gap-4 xl:grid-cols-[3fr_2fr]">
            <MonthlyStatusChart data={aggregate.data.monthly} />
            <CompanyRateBars data={aggregate.data.byCompany} />
          </div>
        </div>
      )}

      <AttendanceLogTable />
    </>
  )
}
