import { isApiError } from '@lms/api-client'
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { authStore } from '../auth/authStore'

/** 세션이 만료되면(401) 로그인 상태를 비워 RequireAuth가 로그인 화면으로 보낸다. */
function handleUnauthorized(error: unknown) {
  if (isApiError(error) && error.status === 401) authStore.setUser(null)
}

export function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({ onError: handleUnauthorized }),
    mutationCache: new MutationCache({ onError: handleUnauthorized }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // 4xx는 재시도해도 결과가 같으므로 재시도하지 않는다.
        retry: (failureCount, error) =>
          !(isApiError(error) && error.status < 500) && failureCount < 2,
        refetchOnWindowFocus: false,
      },
    },
  })
}
