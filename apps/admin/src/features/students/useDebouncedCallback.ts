import { useEffect, useRef } from 'react'

/** 마지막 호출 후 delay(ms) 동안 추가 호출이 없을 때 한 번 실행한다. */
export function useDebouncedCallback<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  delay: number,
) {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const latest = useRef(callback)

  useEffect(() => {
    latest.current = callback
  })

  useEffect(() => () => clearTimeout(timer.current), [])

  return (...args: TArgs) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => latest.current(...args), delay)
  }
}
