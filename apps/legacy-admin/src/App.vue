<script setup lang="ts">
import StudentListPage from './pages/StudentListPage.vue'
</script>

<template>
  <div class="min-h-screen">
    <header class="bg-white">
      <div class="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        <div class="flex items-center gap-2">
          <span
            class="flex size-7 items-center justify-center rounded-lg bg-gray-700 text-sm font-bold text-white"
            aria-hidden="true"
            >L</span
          >
          <span class="text-[17px] font-bold tracking-[-0.02em]">LMS 운영</span>
          <span class="rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
            레거시 · Vue 3
          </span>
        </div>
        <span class="text-[13px] text-gray-500">관리자(데모)</span>
      </div>
    </header>
    <main class="mx-auto max-w-[1200px] px-6 py-10">
      <StudentListPage />
    </main>
  </div>
</template>
