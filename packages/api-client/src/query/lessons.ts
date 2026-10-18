import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchAuditLogs } from '../audit'
import { fetchDashboard } from '../dashboard'
import {
  fetchLesson,
  fetchLessons,
  fetchTeachers,
  updateAttendance,
  type UpdateAttendanceInput,
} from '../lessons'
import type { AuditLogQuery } from '../schemas/audit'
import type { LessonDetail, LessonListQuery } from '../schemas/lesson'

export const lessonKeys = {
  all: ['lessons'] as const,
  lists: () => [...lessonKeys.all, 'list'] as const,
  list: (query: LessonListQuery) => [...lessonKeys.lists(), query] as const,
  detail: (id: string) => [...lessonKeys.all, 'detail', id] as const,
  teachers: () => ['teachers'] as const,
}

export const dashboardKeys = { all: ['dashboard'] as const }

export const auditKeys = {
  all: ['audit-logs'] as const,
  list: (query: AuditLogQuery) => [...auditKeys.all, query] as const,
}

export const lessonQueries = {
  list: (query: LessonListQuery) =>
    queryOptions({
      queryKey: lessonKeys.list(query),
      queryFn: ({ signal }) => fetchLessons(query, signal),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: lessonKeys.detail(id),
      queryFn: ({ signal }) => fetchLesson(id, signal),
    }),
  teachers: () =>
    queryOptions({
      queryKey: lessonKeys.teachers(),
      queryFn: ({ signal }) => fetchTeachers(signal),
      staleTime: Infinity,
    }),
}

export function useLessons(query: LessonListQuery) {
  return useQuery(lessonQueries.list(query))
}

export function useLesson(id: string) {
  return useQuery(lessonQueries.detail(id))
}

export function useTeachers(options: { enabled?: boolean } = {}) {
  return useQuery({ ...lessonQueries.teachers(), ...options })
}

/**
 * 출석 저장. 낙관적 표시는 화면의 useOptimistic이 담당하고,
 * 이 훅은 성공 시 서버 응답으로 캐시를 확정하는 역할만 한다.
 * (mutateAsync가 끝날 때까지 transition이 유지되므로, 확정 후 낙관적 값이 실제 값으로 자연스럽게 교체된다.)
 */
export function useUpdateAttendance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateAttendanceInput) => updateAttendance(input),
    onSuccess: (entry, { lessonId }) => {
      queryClient.setQueryData<LessonDetail>(lessonKeys.detail(lessonId), (lesson) =>
        lesson
          ? {
              ...lesson,
              roster: lesson.roster.map((r) => (r.student.id === entry.student.id ? entry : r)),
            }
          : lesson,
      )
      // 주간 목록의 출석 요약·대시보드·감사 로그는 다음 조회 때 갱신
      void queryClient.invalidateQueries({ queryKey: lessonKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
      void queryClient.invalidateQueries({ queryKey: auditKeys.all })
    },
  })
}

export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.all,
    queryFn: ({ signal }) => fetchDashboard(signal),
  })
}

export function useAuditLogs(query: AuditLogQuery) {
  return useQuery({
    queryKey: auditKeys.list(query),
    queryFn: ({ signal }) => fetchAuditLogs(query, signal),
    placeholderData: (previous) => previous,
  })
}
