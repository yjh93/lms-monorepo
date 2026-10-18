import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
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
  server: { port: 5173 },
  preview: { port: 4173 },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
})
