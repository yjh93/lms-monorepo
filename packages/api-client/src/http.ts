import type { z } from 'zod'
import { apiErrorBodySchema } from './schemas/common'

export interface ApiClientConfig {
  /** 예: '/api' (브라우저, MSW) 또는 'http://localhost:3000/api' (서버/테스트) */
  baseUrl: string
  /** 인증 헤더 등 요청마다 붙일 헤더 */
  getHeaders?: () => Record<string, string>
}

const config: ApiClientConfig = { baseUrl: '/api' }

export function configureApiClient(next: Partial<ApiClientConfig>) {
  Object.assign(config, next)
}

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string>

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

type QueryValue = string | number | boolean | null | undefined | readonly (string | number)[]

interface RequestOptions<TSchema extends z.ZodType> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  query?: Record<string, QueryValue> | URLSearchParams
  body?: unknown
  /** 응답 런타임 검증 스키마. 백엔드(또는 목)와 타입 계약이 어긋나면 즉시 드러난다. */
  schema: TSchema
  signal?: AbortSignal
}

function buildUrl(path: string, query?: RequestOptions<z.ZodType>['query']) {
  const base = config.baseUrl.replace(/\/$/, '')
  const params = query instanceof URLSearchParams ? query : new URLSearchParams()
  if (query && !(query instanceof URLSearchParams)) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue
      if (Array.isArray(value)) value.forEach((item) => params.append(key, String(item)))
      else params.set(key, String(value))
    }
  }
  const search = params.toString()
  return `${base}${path}${search ? `?${search}` : ''}`
}

export async function request<TSchema extends z.ZodType>(
  path: string,
  { method = 'GET', query, body, schema, signal }: RequestOptions<TSchema>,
): Promise<z.output<TSchema>> {
  const response = await fetch(buildUrl(path, query), {
    method,
    signal,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...config.getHeaders?.(),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const data: unknown = response.status === 204 ? null : await response.json().catch(() => null)

  if (!response.ok) {
    const parsed = apiErrorBodySchema.safeParse(data)
    throw new ApiError(
      response.status,
      parsed.success ? parsed.data.message : `요청에 실패했습니다. (${response.status})`,
      parsed.success ? parsed.data.fieldErrors : undefined,
    )
  }

  return schema.parse(data)
}
