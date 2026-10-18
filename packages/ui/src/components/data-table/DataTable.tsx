'use client'

import {
  useTable,
  type OnChangeFn,
  type PaginationState,
  type RowData,
  type SortingState,
} from '@tanstack/react-table'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Button } from '../button/Button'
import { dataTableFeatures, type DataTableColumnDef } from './features'

export interface DataTableProps<TData extends RowData> {
  data: readonly TData[]
  columns: ReadonlyArray<DataTableColumnDef<TData>>
  getRowId?: (row: TData) => string
  /** 서버 정렬 상태 (controlled) */
  sorting?: SortingState
  onSortingChange?: OnChangeFn<SortingState>
  /** 서버 페이지네이션 상태 (controlled). 지정하면 하단 페이지 이동 UI가 표시된다. */
  pagination?: PaginationState
  onPaginationChange?: OnChangeFn<PaginationState>
  /** 서버가 알려준 전체 행 수 */
  rowCount?: number
  isLoading?: boolean
  emptyMessage?: ReactNode
  caption?: string
  className?: string
}

const alignClass = { left: 'text-left', center: 'text-center', right: 'text-right' } as const

export function DataTable<TData extends RowData>({
  data,
  columns,
  getRowId,
  sorting = [],
  onSortingChange,
  pagination,
  onPaginationChange,
  rowCount,
  isLoading = false,
  emptyMessage = '데이터가 없습니다.',
  caption,
  className,
}: DataTableProps<TData>) {
  const table = useTable({
    features: dataTableFeatures,
    data,
    columns,
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
    manualSorting: true,
    manualPagination: true,
    enableSorting: Boolean(onSortingChange),
    rowCount,
    state: {
      sorting,
      ...(pagination ? { pagination } : {}),
    },
    onSortingChange,
    onPaginationChange,
  })

  const rows = table.getRowModel().rows
  const columnCount = table.getAllLeafColumns().length

  return (
    <div className={cn('rounded-card overflow-hidden bg-white', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-[15px]" aria-busy={isLoading || undefined}>
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="border-b border-gray-100">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta
                  const sorted = header.column.getIsSorted()
                  const canSort = header.column.getCanSort()
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={
                        sorted === 'asc'
                          ? 'ascending'
                          : sorted === 'desc'
                            ? 'descending'
                            : undefined
                      }
                      className={cn(
                        'h-12 px-5 text-[13px] font-medium whitespace-nowrap text-gray-500 first:pl-6 last:pr-6',
                        alignClass[meta?.align ?? 'left'],
                        meta?.className,
                      )}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="-mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-1 hover:bg-gray-100 hover:text-gray-800"
                        >
                          <table.FlexRender header={header} />
                          <SortIcon direction={sorted} />
                        </button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody className={cn('transition-opacity', isLoading && 'opacity-40')}>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="px-6 py-20 text-center text-gray-500">
                  {isLoading ? '불러오는 중…' : emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-gray-50">
                  {row.getAllCells().map((cell) => {
                    const meta = cell.column.columnDef.meta
                    return (
                      <td
                        key={cell.id}
                        className={cn(
                          'h-14 px-5 whitespace-nowrap text-gray-800 first:pl-6 last:pr-6',
                          alignClass[meta?.align ?? 'left'],
                          meta?.className,
                        )}
                      >
                        <table.FlexRender cell={cell} />
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <nav
          aria-label="페이지 이동"
          className="flex items-center justify-between gap-4 border-t border-gray-100 px-6 py-4 text-[13px] text-gray-500"
        >
          <span>
            {rowCount !== undefined ? `총 ${rowCount.toLocaleString()}건 · ` : ''}
            {pagination.pageIndex + 1} / {Math.max(table.getPageCount(), 1)} 페이지
          </span>
          <div className="flex gap-2">
            <Button
              variant="neutral"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              이전
            </Button>
            <Button
              variant="neutral"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              다음
            </Button>
          </div>
        </nav>
      )}
    </div>
  )
}

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
  return (
    <span aria-hidden className={cn('text-[10px]', direction ? 'text-brand-500' : 'text-gray-300')}>
      {direction === 'desc' ? '▼' : direction === 'asc' ? '▲' : '↕'}
    </span>
  )
}
