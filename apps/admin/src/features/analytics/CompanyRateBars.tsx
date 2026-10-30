import { formatNumber, formatPercent } from '@lms/utils'
import { ChartCard, DataTableSimple } from '../dashboard/ChartCard'
import { CHART } from '../dashboard/chartTheme'
import type { Aggregate } from './engine/types'

type Row = Aggregate['byCompany'][number]

/**
 * 고객사별 출석률 순위. 막대는 0%가 아니라 고정 하한(60%)부터 그려 차이를 읽기 쉽게 하고,
 * 하한을 쓴다는 사실을 설명 문구와 축 라벨에 드러낸다. 값은 막대 끝에 직접 표기한다.
 */
const FLOOR = 0.6

export function CompanyRateBars({ data }: { data: Row[] }) {
  return (
    <ChartCard
      title="고객사별 출석률"
      description="출석률이 높은 순 · 막대는 60%부터 표시"
      table={
        <DataTableSimple
          caption="고객사별 출석률"
          headers={['고객사', '출석률', '기록 수']}
          rows={data.map((r) => [r.company, formatPercent(r.rate), formatNumber(r.total)])}
        />
      }
    >
      <ul className="flex flex-col gap-2.5">
        {data.map((row) => {
          const width = Math.max(0, (row.rate - FLOOR) / (1 - FLOOR)) * 100
          return (
            <li
              key={row.company}
              className="grid grid-cols-[6.5rem_1fr_3.5rem] items-center gap-3 text-[13px]"
              title={`${row.company} · ${formatPercent(row.rate)} · ${formatNumber(row.total)}건`}
            >
              <span className="truncate text-gray-600">{row.company}</span>
              <span className="h-5 rounded-r bg-gray-50">
                <span
                  className="block h-full rounded-r"
                  style={{ width: `${width}%`, backgroundColor: CHART.series[0] }}
                />
              </span>
              <span className="text-right font-semibold text-gray-900 tabular-nums">
                {formatPercent(row.rate)}
              </span>
            </li>
          )
        })}
      </ul>
    </ChartCard>
  )
}
