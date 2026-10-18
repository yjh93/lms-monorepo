import { defineConfig } from 'vitest/config'
import base from './vite.config'

/** React Compiler 전후 렌더 횟수 측정 전용 설정 (pnpm perf:compiler) */
export default defineConfig({
  ...base,
  test: {
    ...base.test,
    include: ['src/perf/**/*.perf.tsx'],
    // 렌더 카운터 훅은 react-dom보다 먼저 설치돼야 한다.
    setupFiles: ['./src/perf/devtoolsHook.ts', './src/test/setup.ts'],
  },
})
