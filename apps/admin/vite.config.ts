import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defaultClientConditions } from 'vite'
import { defineConfig } from 'vitest/config'

/**
 * React Compiler(Babel, babel-plugin-react-compiler 1.0)를 기본 적용한다.
 * 적용 전후 비교를 위해 REACT_COMPILER=false 로 끌 수 있다. → docs/react-compiler.md
 */
const reactCompiler = process.env.REACT_COMPILER !== 'false'

export default defineConfig({
  plugins: [
    react(),
    ...(reactCompiler ? [babel({ presets: [reactCompilerPreset()] })] : []),
    tailwindcss(),
  ],
  // 워크스페이스 패키지는 dist 대신 src를 직접 읽는다(@lms/source 조건).
  // 패키지를 빌드하지 않아도 dev/test가 동작하고, 패키지 수정이 HMR로 바로 반영된다.
  resolve: { conditions: ['@lms/source', ...defaultClientConditions] },
  // msw와 msw/browser를 처음부터 함께 사전 번들링한다. 개발 중 의존성 재최적화로 두 모듈이
  // 서로 다른 인스턴스가 되면 서비스 워커가 핸들러를 인식하지 못해 목 요청이 404가 된다.
  optimizeDeps: { include: ['msw', 'msw/browser'] },
  server: { port: 5173 },
  preview: { port: 4173 },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    testTimeout: 15_000,
  },
})
