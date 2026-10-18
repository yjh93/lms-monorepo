import { authUserSchema, type AuthUser } from '@lms/api-client'
import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'lms.admin.auth'

function readStoredUser(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    // 저장된 값도 외부 입력으로 보고 스키마로 검증한다(구버전 데이터/수동 조작 대비).
    const parsed = authUserSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

let currentUser: AuthUser | null = readStoredUser()
let signedOutByUser = false
const listeners = new Set<() => void>()

/**
 * 로그인 사용자 외부 스토어.
 * React 바깥(API 클라이언트의 헤더 주입, QueryCache 401 처리)에서도 읽고 써야 해서
 * Context 대신 외부 스토어 + useSyncExternalStore로 구독한다.
 */
export const authStore = {
  getUser: () => currentUser,
  /** 사용자가 직접 로그아웃했는지. 이 경우엔 로그인 후 "원래 보던 화면"으로 되돌리지 않는다. */
  wasSignedOutByUser: () => signedOutByUser,
  signOut() {
    authStore.setUser(null)
    // 구독자 리렌더는 이벤트 핸들러가 끝난 뒤 일어나므로, 그 전에 플래그를 세운다.
    signedOutByUser = true
  },
  setUser(user: AuthUser | null) {
    signedOutByUser = false
    currentUser = user
    try {
      if (user) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user))
      else sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // 저장소 접근이 막힌 환경에서도 메모리 상태로는 동작한다.
    }
    listeners.forEach((listener) => listener())
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

export function useAuthUser() {
  return useSyncExternalStore(authStore.subscribe, authStore.getUser, authStore.getUser)
}
