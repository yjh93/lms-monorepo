import { authUserSchema, type AuthUser } from '@lms/api-client'
import { createJSONStorage, persist } from 'zustand/middleware'
import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'

interface AuthState {
  user: AuthUser | null
  /** 사용자가 직접 로그아웃했는지. 이 경우엔 로그인 후 "원래 보던 화면"으로 되돌리지 않는다. */
  signedOutByUser: boolean
}

/**
 * 로그인 사용자 스토어 (Zustand vanilla store).
 * React 바깥(API 클라이언트의 헤더 주입, QueryCache 401 처리)에서도 getState()로 읽고 쓸 수 있어
 * Context 대신 외부 스토어를 쓴다. 새로고침에도 유지되도록 sessionStorage에 user만 저장한다.
 */
const store = createStore<AuthState>()(
  persist((): AuthState => ({ user: null, signedOutByUser: false }), {
    name: 'lms.admin.auth',
    version: 1,
    storage: createJSONStorage(() => sessionStorage),
    partialize: (state) => ({ user: state.user }),
    // 저장된 값도 외부 입력으로 보고 스키마로 검증한다(구버전 데이터/수동 조작 대비).
    merge: (persisted, current) => {
      const parsed = authUserSchema.safeParse((persisted as Partial<AuthState> | undefined)?.user)
      return { ...current, user: parsed.success ? parsed.data : null }
    },
  }),
)

export const authStore = {
  getUser: () => store.getState().user,
  wasSignedOutByUser: () => store.getState().signedOutByUser,
  setUser: (user: AuthUser | null) => store.setState({ user, signedOutByUser: false }),
  signOut: () => store.setState({ user: null, signedOutByUser: true }),
}

export function useAuthUser() {
  return useStore(store, (state) => state.user)
}
