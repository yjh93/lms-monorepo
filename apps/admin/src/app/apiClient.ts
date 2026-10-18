import { configureApiClient, DEMO_USER_HEADER } from '@lms/api-client'
import { authStore } from '../auth/authStore'

/** 요청마다 현재 로그인 사용자를 헤더로 전달한다(목 서버의 RBAC·감사 로그 주체). */
export function setupApiClient(baseUrl: string) {
  configureApiClient({
    baseUrl,
    getHeaders: (): Record<string, string> => {
      const user = authStore.getUser()
      return user ? { [DEMO_USER_HEADER]: user.id } : {}
    },
  })
}
