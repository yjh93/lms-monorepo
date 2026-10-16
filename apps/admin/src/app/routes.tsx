import { Navigate, type RouteObject } from 'react-router'
import { StudentCreatePage } from '../features/students/StudentCreatePage'
import { StudentEditPage } from '../features/students/StudentEditPage'
import { StudentListPage } from '../features/students/StudentListPage'
import { AppLayout } from '../layouts/AppLayout'
import { NotFoundPage } from '../pages/NotFoundPage'
import { RouteErrorPage } from '../pages/RouteErrorPage'

/** 라우트 정의는 테스트(createMemoryRouter)에서도 재사용하도록 router 인스턴스와 분리한다. */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <Navigate to="/students" replace /> },
      {
        path: 'students',
        children: [
          { index: true, element: <StudentListPage /> },
          { path: 'new', element: <StudentCreatePage /> },
          { path: ':studentId/edit', element: <StudentEditPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
