import {
  fetchStudents,
  parseStudentListQuery,
  toStudentListSearchParams,
  type Paginated,
  type Student,
  type StudentListQuery,
} from '@lms/api-client'
import { reactive, ref, shallowRef, watch } from 'vue'

/**
 * 수강생 목록 상태(레거시 Vue 구현).
 * URL 쿼리 파싱·직렬화와 API 호출은 React 어드민과 같은 @lms/api-client 함수를 그대로 쓴다.
 * → 마이그레이션 전후 화면이 "같은 URL = 같은 결과"를 보장하는 근거가 된다.
 */
export function useStudentList(location: Pick<Location, 'search'> = window.location) {
  const query = reactive<StudentListQuery>(
    parseStudentListQuery(new URLSearchParams(location.search)),
  )
  const result = shallowRef<Paginated<Student> | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  let controller: AbortController | null = null

  async function load() {
    controller?.abort()
    controller = new AbortController()
    loading.value = true
    error.value = null
    try {
      result.value = await fetchStudents({ ...query }, controller.signal)
    } catch (cause) {
      if ((cause as Error).name !== 'AbortError') error.value = (cause as Error).message
    } finally {
      loading.value = false
    }
  }

  function syncUrl() {
    const search = toStudentListSearchParams({ ...query }).toString()
    history.replaceState(null, '', search ? `?${search}` : location.search.split('?')[0] || '?')
  }

  /** 필터를 바꾸면 1페이지로 돌아간다(React 어드민과 같은 규칙). */
  function update(patch: Partial<StudentListQuery>) {
    Object.assign(query, patch, 'page' in patch ? {} : { page: 1 })
  }

  watch(
    () => ({ ...query }),
    () => {
      syncUrl()
      void load()
    },
    { deep: true },
  )

  void load()

  return { query, result, loading, error, update, reload: load }
}
