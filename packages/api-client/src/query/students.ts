import {
  keepPreviousData,
  type QueryClient,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { Student, StudentFormValues, StudentListQuery } from '../schemas/student'
import {
  createStudent,
  fetchCompanies,
  fetchStudent,
  fetchStudents,
  importStudents,
  updateStudent,
} from '../students'
import { auditKeys, dashboardKeys } from './lessons'

/**
 * Query key factory: 키를 한 곳에서 계층적으로 관리한다.
 * invalidateQueries({ queryKey: studentKeys.lists() }) 처럼 범위 단위 무효화가 가능하다.
 */
export const studentKeys = {
  all: ['students'] as const,
  lists: () => [...studentKeys.all, 'list'] as const,
  list: (query: StudentListQuery) => [...studentKeys.lists(), query] as const,
  details: () => [...studentKeys.all, 'detail'] as const,
  detail: (id: string) => [...studentKeys.details(), id] as const,
  companies: () => [...studentKeys.all, 'companies'] as const,
}

/** queryOptions로 키·fetcher·타입을 묶어 useQuery, prefetchQuery, 라우터 loader에서 재사용 */
export const studentQueries = {
  list: (query: StudentListQuery) =>
    queryOptions({
      queryKey: studentKeys.list(query),
      queryFn: ({ signal }) => fetchStudents(query, signal),
      // 페이지/필터 전환 중 이전 결과를 유지해 테이블이 깜빡이지 않게 한다.
      placeholderData: keepPreviousData,
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: studentKeys.detail(id),
      queryFn: ({ signal }) => fetchStudent(id, signal),
    }),
  companies: () =>
    queryOptions({
      queryKey: studentKeys.companies(),
      queryFn: ({ signal }) => fetchCompanies(signal),
      staleTime: 5 * 60_000,
    }),
}

export function useStudents(query: StudentListQuery) {
  return useQuery(studentQueries.list(query))
}

export function useStudent(id: string | undefined) {
  return useQuery({ ...studentQueries.detail(id ?? ''), enabled: Boolean(id) })
}

export function useCompanies() {
  return useQuery(studentQueries.companies())
}

export function useCreateStudent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: StudentFormValues) => createStudent(values),
    onSuccess: (student) => {
      queryClient.setQueryData(studentKeys.detail(student.id), student)
      return invalidateAfterStudentChange(queryClient)
    },
  })
}

export function useUpdateStudent(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: StudentFormValues) => updateStudent(id, values),
    onSuccess: (student: Student) => {
      queryClient.setQueryData(studentKeys.detail(id), student)
      return invalidateAfterStudentChange(queryClient)
    },
  })
}

export function useImportStudents() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (rows: StudentFormValues[]) => importStudents(rows),
    onSuccess: () => invalidateAfterStudentChange(queryClient),
  })
}

/** 수강생 변경은 목록·고객사 옵션·대시보드·감사 로그에 영향을 준다. */
function invalidateAfterStudentChange(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: studentKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: studentKeys.companies() }),
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
    queryClient.invalidateQueries({ queryKey: auditKeys.all }),
  ])
}
