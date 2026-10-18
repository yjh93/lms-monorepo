import type { RouteObject } from 'react-router'
import { HomeRedirect, RequireAuth, RequirePermission } from '../auth/guards'
import { LoginPage } from '../auth/LoginPage'
import { StudentCreatePage } from '../features/students/StudentCreatePage'
import { StudentEditPage } from '../features/students/StudentEditPage'
import { StudentListPage } from '../features/students/StudentListPage'
import { AppLayout } from '../layouts/AppLayout'
import { NotFoundPage } from '../pages/NotFoundPage'
import { RouteErrorPage } from '../pages/RouteErrorPage'

/** 라우트 정의는 테스트(createMemoryRouter)에서도 재사용하도록 router 인스턴스와 분리한다. */
export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          { index: true, element: <HomeRedirect /> },
          {
            path: 'students',
            element: <RequirePermission permission="student:read" />,
            children: [
              { index: true, element: <StudentListPage /> },
              {
                element: <RequirePermission permission="student:create" />,
                children: [{ path: 'new', element: <StudentCreatePage /> }],
              },
              {
                element: <RequirePermission permission="student:update" />,
                children: [{ path: ':studentId/edit', element: <StudentEditPage /> }],
              },
            ],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]
