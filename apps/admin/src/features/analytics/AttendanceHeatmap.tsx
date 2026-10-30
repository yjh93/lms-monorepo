import { cn } from '@lms/ui'
import { formatNumber, formatPercent } from '@lms/utils'
import { ChartCard, DataTableSimple } from '../dashboard/ChartCard'
import { useAnalyticsStore } from './analyticsStore'
import { slotLabel } from './engine/dataset'
import { SLOT_COUNT, WEEKDAY_LABEL, type HeatCell } from './engine/types'

/**
 * 단일 색상(파랑) 5단계 램프: 밝을수록 낮은 출석률.
 * 단계형 램프 검증(명도 단조 증가, 인접 단계 간격, 가장 밝은 단계도 배경 대비 2:1 이상)을 통과한 값이다.
 */
const RAMP = ['#86b6ef', '#5598e7', '#2a78d6', '#1c5cab', '#104281']
const DARK_FROM = 2 // 이 단계부터 흰 글자

function stepOf(rate: number, min: number, max: number) {
  if (max - min < 1e-6) return RAMP.length - 1
  return Math.min(RAMP.length - 1, Math.floor(((rate - min) / (max - min)) * RAMP.length))
}

/**
 * 요일 × 시간대 출석률 히트맵.
 * 셀을 누르면 해당 요일·시간대로 교차 필터가 걸려 KPI·차트·로그 목록이 함께 바뀐다.
 */
export function AttendanceHeatmap({ cells }: { cells: HeatCell[] }) {
  const selected = useAnalyticsStore((s) => s.filters.cell)
  const toggleCell = useAnalyticsStore((s) => s.toggleCell)

  const rates = cells.filter((c) => c.rate !== null && c.total >= 20).map((c) => c.rate!)
  const min = Math.min(...rates)
  const max = Math.max(...rates)
  const grid = Array.from({ length: 7 }, (_, weekday) =>
    cells.filter((c) => c.weekday === weekday).sort((a, b) => a.slot - b.slot),
  )

  return (
    <ChartCard
      title="요일 · 시간대별 출석률"
      description="셀을 누르면 해당 요일·시간대로 아래 지표와 목록이 필터링됩니다. (표본 20건 미만은 회색)"
      legend={
        <div className="mb-4 flex items-center gap-2 text-[13px] text-gray-500">
          <span>{rates.length ? formatPercent(min) : '-'}</span>
          <span aria-hidden className="flex">
            {RAMP.map((color) => (
              <span
                key={color}
                className="h-2.5 w-6 first:rounded-l last:rounded-r"
                style={{ backgroundColor: color }}
              />
            ))}
          </span>
          <span>{rates.length ? formatPercent(max) : '-'}</span>
        </div>
      }
      table={
        <DataTableSimple
          caption="요일·시간대별 출석률"
          headers={['요일', ...Array.from({ length: SLOT_COUNT }, (_, slot) => slotLabel(slot))]}
          rows={grid.map((row, weekday) => [
            WEEKDAY_LABEL[weekday]!,
            ...row.map((c) => (c.rate === null ? '-' : formatPercent(c.rate, 0))),
          ])}
        />
      }
    >
      <div className="overflow-x-auto">
        <div
          className="grid min-w-[640px] gap-1"
          style={{ gridTemplateColumns: `2rem repeat(${SLOT_COUNT}, minmax(0, 1fr))` }}
        >
          <span />
          {Array.from({ length: SLOT_COUNT }, (_, slot) => (
            <span key={slot} className="pb-1 text-center text-[11px] text-gray-500 tabular-nums">
              {slotLabel(slot).slice(0, 2)}
            </span>
          ))}
          {grid.map((row, weekday) => (
            <div key={weekday} className="contents">
              <span className="flex items-center text-[13px] font-medium text-gray-600">
                {WEEKDAY_LABEL[weekday]}
              </span>
              {row.map((cell) => {
                const enough = cell.rate !== null && cell.total >= 20
                const step = enough ? stepOf(cell.rate!, min, max) : -1
                const isSelected = selected?.weekday === cell.weekday && selected.slot === cell.slot
                return (
                  <button
                    key={cell.slot}
                    type="button"
                    disabled={!enough}
                    aria-pressed={isSelected}
                    aria-label={`${WEEKDAY_LABEL[weekday]}요일 ${slotLabel(cell.slot)} 출석률 ${enough ? formatPercent(cell.rate) : '표본 부족'}, ${formatNumber(cell.total)}건`}
                    title={`${WEEKDAY_LABEL[weekday]} ${slotLabel(cell.slot)} · ${enough ? formatPercent(cell.rate) : '표본 부족'} · ${formatNumber(cell.total)}건`}
                    onClick={() => toggleCell({ weekday: cell.weekday, slot: cell.slot })}
                    className={cn(
                      'flex h-9 items-center justify-center rounded-md text-[11px] font-semibold tabular-nums transition-[box-shadow,transform]',
                      'hover:scale-[1.06] disabled:hover:scale-100',
                      isSelected && 'ring-2 ring-gray-900 ring-offset-2',
                      !enough && 'bg-gray-100 text-gray-300',
                      enough && (step >= DARK_FROM ? 'text-white' : 'text-gray-800'),
                    )}
                    style={enough ? { backgroundColor: RAMP[step] } : undefined}
                  >
                    {enough ? Math.round(cell.rate! * 100) : ''}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  )
}
