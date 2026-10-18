import type { ReactNode } from 'react'

interface ChartCardProps {
  title: string
  description?: string
  /** 범례 등 차트 위 보조 영역 */
  legend?: ReactNode
  /** 같은 데이터를 표로 제공(색 대비가 낮은 계열·스크린리더 대응) */
  table: ReactNode
  children: ReactNode
}

export function ChartCard({ title, description, legend, table, children }: ChartCardProps) {
  return (
    <section aria-label={title} className="rounded-card bg-white p-6">
      <header className="mb-5">
        <h2 className="text-[17px] font-bold text-gray-900">{title}</h2>
        {description && <p className="mt-1 text-[13px] text-gray-500">{description}</p>}
      </header>
      {legend}
      {/* 시각 차트는 보조 기술에서 숨기고, 같은 정보를 아래 표로 제공한다 */}
      <div aria-hidden>{children}</div>
      <details className="mt-4 text-sm">
        <summary className="inline-flex h-8 cursor-pointer items-center rounded-lg bg-gray-100 px-3 text-[13px] font-medium text-gray-600 hover:bg-gray-200">
          표로 보기
        </summary>
        <div className="mt-2 overflow-x-auto">{table}</div>
      </details>
    </section>
  )
}

export function DataTableSimple({
  caption,
  headers,
  rows,
}: {
  caption: string
  headers: string[]
  rows: (string | number)[][]
}) {
  return (
    <table className="w-full text-[13px]">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="border-b border-gray-100 text-gray-500">
          {headers.map((header, index) => (
            <th
              key={header}
              scope="col"
              className={index === 0 ? 'py-1.5 text-left' : 'py-1.5 text-right'}
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="tabular-nums">
        {rows.map((row) => (
          <tr key={String(row[0])} className="border-b border-gray-100">
            {row.map((cell, index) => (
              <td key={index} className={index === 0 ? 'py-1.5 text-left' : 'py-1.5 text-right'}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
