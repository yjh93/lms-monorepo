import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defaultClientConditions } from 'vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  // React 어드민과 같은 공유 패키지(api-client, utils)를 소스로 참조한다.
  resolve: { conditions: ['@lms/source', ...defaultClientConditions] },
  optimizeDeps: { include: ['msw', 'msw/browser'] },
  server: { port: 5174 },
  preview: { port: 4174 },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
})
