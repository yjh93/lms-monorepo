import {
  createColumnHelper,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  type ColumnDef,
  type RowData,
} from '@tanstack/react-table'

/**
 * DataTable이 사용하는 TanStack Table v9 기능 목록.
 * v9는 필요한 feature만 등록해 번들에 포함시키는 구조라, 서버 정렬/페이지네이션만 쓰는
 * 어드민 목록은 정렬·페이지네이션 feature만 등록한다(정렬/자르기는 서버가 담당).
 */
export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  columnMeta: {} as { align?: 'left' | 'center' | 'right'; className?: string },
})

export type DataTableFeatures = typeof dataTableFeatures

/** 사용처에서 컬럼 정의 시 features 타입을 맞추기 위한 헬퍼 */
export function createDataTableColumnHelper<TData extends RowData>() {
  return createColumnHelper<DataTableFeatures, TData>()
}

// 컬럼마다 값 타입(TValue)이 달라 배열 요소 타입은 any로 받는다(TanStack 공식 패턴).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DataTableColumnDef<TData extends RowData> = ColumnDef<DataTableFeatures, TData, any>
