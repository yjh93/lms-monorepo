import type { AnalyticsClient } from './types'

type Pending = { resolve: (value: unknown) => void; reject: (error: Error) => void }

/** Web Worker와 Promise 기반 RPC로 통신하는 클라이언트 */
export function createWorkerClient(): AnalyticsClient {
  const worker = new Worker(new URL('./analytics.worker.ts', import.meta.url), { type: 'module' })
  const pending = new Map<number, Pending>()
  let sequence = 0

  worker.onmessage = ({ data }: MessageEvent<{ id: number; result?: unknown; error?: string }>) => {
    const request = pending.get(data.id)
    if (!request) return
    pending.delete(data.id)
    if (data.error) request.reject(new Error(data.error))
    else request.resolve(data.result)
  }

  const call =
    <T>(method: keyof AnalyticsClient) =>
    (...args: unknown[]) =>
      new Promise<T>((resolve, reject) => {
        const id = ++sequence
        pending.set(id, { resolve: resolve as (value: unknown) => void, reject })
        worker.postMessage({ id, method, args })
      })

  return {
    info: call('info'),
    aggregate: call('aggregate'),
    rows: call('rows'),
  } as AnalyticsClient
}
