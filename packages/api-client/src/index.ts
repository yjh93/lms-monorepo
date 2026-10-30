/**
 * @lms/api-client 기본 엔트리: 프레임워크 비의존(zod 스키마, 타입, fetch 함수).
 * React 없이 쓸 수 있어 Next.js Server Component/Server Action에서도 import 가능하다.
 * - React Query 훅: '@lms/api-client/query'
 * - MSW 핸들러: '@lms/api-client/mocks'
 */
export * from './schemas/audit'
export * from './schemas/auth'
export * from './schemas/common'
export * from './schemas/course'
export * from './schemas/fields'
export * from './schemas/dashboard'
export * from './schemas/lesson'
export * from './schemas/student'
export { ApiError, configureApiClient, isApiError, request, type ApiClientConfig } from './http'
export { fetchAuditLogs } from './audit'
export { login } from './auth'
export { fetchDashboard } from './dashboard'
export {
  fetchLesson,
  fetchLessons,
  fetchTeachers,
  updateAttendance,
  type UpdateAttendanceInput,
} from './lessons'
export {
  createStudent,
  fetchCompanies,
  fetchStudent,
  fetchStudents,
  importStudents,
  updateStudent,
} from './students'
