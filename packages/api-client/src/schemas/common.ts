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

/** 페이지 번호: 1 이상의 정수, 아니면 1 */
export const pageParam = z.coerce.number().int().min(1).catch(1)

/** 페이지 크기: PAGE_SIZES 중 하나, 아니면 fallback */
export function pageSizeParam(fallback: PageSize = 10) {
  return z.coerce
    .number()
    .refine((v): v is PageSize => (PAGE_SIZES as readonly number[]).includes(v))
    .catch(fallback)
}

/**
 * URL 쿼리 ↔ 타입 객체 변환기를 스키마로부터 만든다.
 * - parse: 배열 키는 getAll로 수집하고, 잘못된 값은 스키마의 .catch()로 기본값 대체
 * - serialize: 기본값과 같은 항목은 생략해 URL을 짧게 유지
 * admin의 URL 상태와 MSW 서버의 요청 파싱이 같은 변환기를 쓴다.
 */
export function createSearchParamsCodec<TSchema extends z.ZodObject>(
  schema: TSchema,
  arrayKeys: ReadonlyArray<keyof z.output<TSchema> & string> = [],
) {
  type Query = z.output<TSchema>
  const defaults = schema.parse({}) as Query

  function parse(params: URLSearchParams): Query {
    const raw: Record<string, unknown> = Object.fromEntries(params)
    for (const key of arrayKeys) raw[key] = params.getAll(key)
    return schema.parse(raw) as Query
  }

  function serialize(query: Partial<Query>): URLSearchParams {
    const params = new URLSearchParams()
    const merged: Record<string, unknown> = { ...defaults, ...query }
    for (const [key, value] of Object.entries(merged)) {
      if (Array.isArray(value)) {
        for (const item of value) params.append(key, String(item))
      } else if (value !== defaults[key as keyof Query] && value !== '' && value != null) {
        params.set(key, String(value))
      }
    }
    return params
  }

  return { defaults, parse, serialize }
}
