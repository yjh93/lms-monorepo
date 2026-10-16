import { z } from 'zod'

export const SORT_ORDERS = ['asc', 'desc'] as const
export const sortOrderSchema = z.enum(SORT_ORDERS)
export type SortOrder = z.infer<typeof sortOrderSchema>

export const PAGE_SIZES = [10, 20, 50] as const
export type PageSize = (typeof PAGE_SIZES)[number]

/** 서버 페이지네이션 응답 공통 형태 */
export function paginatedSchema<TItem extends z.ZodType>(item: TItem) {
  return z.object({
    items: z.array(item),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
  })
}

export type Paginated<TItem> = {
  items: TItem[]
  total: number
  page: number
  pageSize: number
}

/** API 에러 응답 공통 형태. fieldErrors는 폼 필드에 그대로 매핑된다. */
export const apiErrorBodySchema = z.object({
  message: z.string(),
  fieldErrors: z.record(z.string(), z.string()).optional(),
})
export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>

/**
 * URL 쿼리 배열 값(?status=A&status=B)을 허용된 값만 남겨 파싱한다.
 * 잘못된 값 하나 때문에 필터 전체가 초기화되지 않도록 원소 단위로 걸러낸다.
 */
export function enumArrayParam<const T extends readonly [string, ...string[]]>(values: T) {
  const allowed = new Set<string>(values)
  return z
    .array(z.string())
    .catch([])
    .transform((items) => [...new Set(items)].filter((v): v is T[number] => allowed.has(v)))
}
