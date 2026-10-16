import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { routes } from '../app/routes'

/** 실제 라우트 트리를 메모리 라우터로 렌더링한다. router.state.location으로 URL을 검증할 수 있다. */
export function renderRoute(initialPath: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
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
