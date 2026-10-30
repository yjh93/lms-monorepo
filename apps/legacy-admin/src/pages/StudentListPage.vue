<script setup lang="ts">
import {
  LEVEL_LABEL,
  STUDENT_STATUS_LABEL,
  STUDENT_STATUSES,
  type StudentStatus,
} from '@lms/api-client'
import { formatDate, formatPhone } from '@lms/utils'
import { computed, ref } from 'vue'
import { useStudentList } from '../composables/useStudentList'

const { query, result, loading, error, update } = useStudentList()

const keyword = ref(query.q)
let timer: ReturnType<typeof setTimeout> | undefined
function onKeyword(value: string) {
  keyword.value = value
  clearTimeout(timer)
  timer = setTimeout(() => update({ q: value }), 300)
}

function toggleStatus(status: StudentStatus) {
  const next = query.status.includes(status)
    ? query.status.filter((s) => s !== status)
    : STUDENT_STATUSES.filter((s) => s === status || query.status.includes(s))
  update({ status: next })
}

const pageCount = computed(() =>
  result.value ? Math.max(1, Math.ceil(result.value.total / query.pageSize)) : 1,
)

const statusTone: Record<StudentStatus, string> = {
  ACTIVE: 'bg-success-50 text-success-700',
  PAUSED: 'bg-warning-50 text-warning-700',
  COMPLETED: 'bg-brand-50 text-brand-600',
  DROPPED: 'bg-danger-50 text-danger-600',
}
</script>

<template>
  <section>
    <h1 class="text-[26px] font-bold tracking-[-0.02em]">수강생</h1>
    <p class="mt-1.5 text-[15px] text-gray-600">
      레거시 Vue 화면 · React 어드민(/students)과 같은 API·URL 규칙을 사용합니다.
    </p>

    <div
      aria-label="수강생 검색 필터"
      class="rounded-card mt-6 mb-4 flex flex-col gap-5 bg-white p-6"
    >
      <label class="flex flex-col gap-2">
        <span class="text-[13px] font-semibold text-gray-700">검색</span>
        <input
          type="search"
          :value="keyword"
          placeholder="이름, 이메일, 전화번호, 부서"
          class="focus:ring-brand-500 h-12 rounded-xl bg-gray-100 px-4 text-[15px] focus:bg-white focus:ring-2 focus:outline-none"
          @input="onKeyword(($event.target as HTMLInputElement).value)"
        />
      </label>
      <fieldset>
        <legend class="mb-2 text-[13px] font-semibold text-gray-700">수강 상태</legend>
        <div class="flex flex-wrap gap-2">
          <label v-for="status in STUDENT_STATUSES" :key="status" class="cursor-pointer">
            <input
              type="checkbox"
              class="peer sr-only"
              :checked="query.status.includes(status)"
              @change="toggleStatus(status)"
            />
            <span
              class="inline-flex h-9 items-center rounded-full bg-gray-100 px-3.5 text-[14px] font-medium text-gray-600 peer-checked:bg-gray-800 peer-checked:text-white"
            >
              {{ STUDENT_STATUS_LABEL[status] }}
            </span>
          </label>
        </div>
      </fieldset>
    </div>

    <div class="rounded-card overflow-hidden bg-white">
      <p v-if="error" role="alert" class="text-danger-600 p-10 text-center">{{ error }}</p>
      <table v-else class="w-full text-[15px]" :aria-busy="loading || undefined">
        <caption class="sr-only">
          수강생 목록
        </caption>
        <thead class="border-b border-gray-100 text-[13px] text-gray-500">
          <tr>
            <th scope="col" class="h-12 px-6 text-left font-medium">이름</th>
            <th scope="col" class="px-5 text-left font-medium">이메일</th>
            <th scope="col" class="px-5 text-left font-medium">전화번호</th>
            <th scope="col" class="px-5 text-left font-medium">고객사</th>
            <th scope="col" class="px-5 text-left font-medium">레벨</th>
            <th scope="col" class="px-5 text-left font-medium">상태</th>
            <th scope="col" class="px-6 text-left font-medium">등록일</th>
          </tr>
        </thead>
        <tbody :class="{ 'opacity-40': loading }">
          <tr v-if="result && result.items.length === 0">
            <td colspan="7" class="py-20 text-center text-gray-500">
              조건에 맞는 수강생이 없습니다.
            </td>
          </tr>
          <tr v-for="student in result?.items ?? []" :key="student.id" class="hover:bg-gray-50">
            <td class="h-14 px-6 font-semibold whitespace-nowrap">{{ student.name }}</td>
            <td class="px-5 whitespace-nowrap">{{ student.email }}</td>
            <td class="px-5 whitespace-nowrap">{{ formatPhone(student.phone) }}</td>
            <td class="px-5 whitespace-nowrap">{{ student.company }}</td>
            <td class="px-5 whitespace-nowrap">{{ LEVEL_LABEL[student.level] }}</td>
            <td class="px-5">
              <span
                class="inline-flex h-6 items-center rounded-md px-2 text-xs font-semibold"
                :class="statusTone[student.status]"
                >{{ STUDENT_STATUS_LABEL[student.status] }}</span
              >
            </td>
            <td class="px-6 whitespace-nowrap">{{ formatDate(student.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
      <nav
        aria-label="페이지 이동"
        class="flex items-center justify-between border-t border-gray-100 px-6 py-4 text-[13px] text-gray-500"
      >
        <span>총 {{ result?.total ?? 0 }}건 · {{ query.page }} / {{ pageCount }} 페이지</span>
        <div class="flex gap-2">
          <button
            type="button"
            class="h-9 cursor-pointer rounded-[10px] bg-gray-100 px-3 font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="query.page <= 1"
            @click="update({ page: query.page - 1 })"
          >
            이전
          </button>
          <button
            type="button"
            class="h-9 cursor-pointer rounded-[10px] bg-gray-100 px-3 font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="query.page >= pageCount"
            @click="update({ page: query.page + 1 })"
          >
            다음
          </button>
        </div>
      </nav>
    </div>
  </section>
</template>
