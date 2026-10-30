import { defaultServerConditions } from 'vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    conditions: ['@lms/source', ...defaultServerConditions],
    alias: { '@/': new URL('./src/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1') },
  },
  // node 환경 테스트는 SSR 해석 규칙을 쓰므로 여기에도 같은 조건을 준다.
  ssr: { resolve: { conditions: ['@lms/source', ...defaultServerConditions] } },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // 워크스페이스 패키지는 Node 외부 모듈로 넘기지 않고 Vite가 처리해야 @lms/source 조건(소스 참조)이 적용된다.
    server: { deps: { inline: [/@lms\//] } },
  },
})
