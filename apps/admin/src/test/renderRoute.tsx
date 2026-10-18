import { DEMO_USERS } from '@lms/api-client/mocks'
import type { Role } from '@lms/utils'
import { QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { createQueryClient } from '../app/queryClient'
import { routes } from '../app/routes'
import { authStore } from '../auth/authStore'

interface RenderRouteOptions {
  /** 로그인할 역할. null이면 비로그인 상태로 시작. 기본 ADMIN */
  role?: Role | null
}

/** 실제 라우트 트리를 메모리 라우터로 렌더링한다. router.state.location으로 URL을 검증할 수 있다. */
export function renderRoute(initialPath: string, { role = 'ADMIN' }: RenderRouteOptions = {}) {
  authStore.setUser(role ? DEMO_USERS.find((u) => u.role === role)! : null)

  const queryClient = createQueryClient()
  queryClient.setDefaultOptions({
    queries: { ...queryClient.getDefaultOptions().queries, retry: false },
    mutations: { retry: false },
  })
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] })

  const utils = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )

  return {
    ...utils,
    router,
    queryClient,
    /** 현재 URL의 search 파라미터 */
    searchParams: () => new URLSearchParams(router.state.location.search),
  }
}
