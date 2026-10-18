import type { Dashboard } from '@lms/api-client'
import { formatNumber, formatPercent } from '@lms/utils'

interface TileProps {
  label: string
  value: string
  caption?: React.ReactNode
}

function Tile({ label, value, caption }: TileProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="mt-2 text-3xl font-semibold text-gray-900">{value}</dd>
      {caption && <dd className="mt-1 text-xs text-gray-500">{caption}</dd>}
    </div>
  )
}

/** 출석률 변화: 색만으로 의미를 전달하지 않도록 화살표 + 부호 + 문구를 함께 쓴다. */
function Delta({ value }: { value: number }) {
  const points = Math.abs(value * 100).toFixed(1)
  if (Math.abs(value) < 0.0005) return <span>직전 4주와 같음</span>
  const up = value > 0
  return (
    <span className={up ? 'text-success-700' : 'text-danger-700'}>
      <span aria-hidden>{up ? '▲' : '▼'}</span> {up ? '+' : '−'}
      {points}%p <span className="text-gray-500">직전 4주 대비</span>
    </span>
  )
}

export function KpiTiles({ kpis }: { kpis: Dashboard['kpis'] }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Tile label="전체 수강생" value={`${formatNumber(kpis.totalStudents)}명`} />
      <Tile
        label="수강중"
        value={`${formatNumber(kpis.activeStudents)}명`}
        caption={`전체의 ${formatPercent(kpis.activeStudents / kpis.totalStudents)}`}
      />
      <Tile
        label="이번 주 수업"
        value={`${formatNumber(kpis.lessonsThisWeek)}회`}
        caption="휴강 제외"
      />
      <Tile
        label="최근 4주 출석률"
        value={formatPercent(kpis.attendanceRate)}
        caption={<Delta value={kpis.attendanceRateDelta} />}
      />
    </dl>
  )
}
