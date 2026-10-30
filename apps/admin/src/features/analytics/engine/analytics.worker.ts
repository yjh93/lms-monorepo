/// <reference lib="webworker" />
import { createAnalyticsService } from './service'
import type { AnalyticsClient } from './types'

type Method = keyof AnalyticsClient
interface Request {
  id: number
  method: Method
  args: unknown[]
}

// 데이터 생성·필터·집계·정렬을 모두 워커에서 처리해 메인 스레드(UI)를 막지 않는다.
const service = createAnalyticsService()

self.onmessage = async ({ data }: MessageEvent<Request>) => {
  try {
    const method = service[data.method] as (...args: unknown[]) => Promise<unknown>
    const result = await method(...data.args)
    self.postMessage({ id: data.id, result })
  } catch (error) {
    self.postMessage({ id: data.id, error: error instanceof Error ? error.message : String(error) })
  }
}
