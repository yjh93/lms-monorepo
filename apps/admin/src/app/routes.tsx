import type { RouteObject } from 'react-router'
import { HomeRedirect, RequireAuth, RequirePermission } from '../auth/guards'
import { LoginPage } from '../auth/LoginPage'
import { AuditLogPage } from '../features/audit/AuditLogPage'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { LessonDetailPage } from '../features/lessons/LessonDetailPage'
import { LessonListPage } from '../features/lessons/LessonListPage'
import { StudentCreatePage } from '../features/students/StudentCreatePage'
import { StudentEditPage } from '../features/students/StudentEditPage'
import { StudentImportPage } from '../features/students/import/StudentImportPage'
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
            path: 'dashboard',
            element: <RequirePermission permission="dashboard:read" />,
            children: [{ index: true, element: <DashboardPage /> }],
          },
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
                element: <RequirePermission permission="student:import" />,
                children: [{ path: 'import', element: <StudentImportPage /> }],
              },
              {
                element: <RequirePermission permission="student:update" />,
                children: [{ path: ':studentId/edit', element: <StudentEditPage /> }],
              },
            ],
          },
          {
            path: 'lessons',
            element: <RequirePermission permission="lesson:read" />,
            children: [
              { index: true, element: <LessonListPage /> },
              { path: ':lessonId', element: <LessonDetailPage /> },
            ],
          },
          {
            path: 'analytics',
            element: <RequirePermission permission="analytics:read" />,
            // 데이터셋·차트 코드가 커서 이 화면에 들어올 때만 내려받는다(라우트 단위 코드 분할).
            children: [
              {
                index: true,
                lazy: async () => ({
                  Component: (await import('../features/analytics/AnalyticsPage')).AnalyticsPage,
                }),
              },
            ],
          },
          {
            path: 'audit-logs',
            element: <RequirePermission permission="audit:read" />,
            children: [{ index: true, element: <AuditLogPage /> }],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]
