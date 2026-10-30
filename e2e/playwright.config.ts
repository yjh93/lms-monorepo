import { defineConfig, devices } from '@playwright/test'

const CI = Boolean(process.env.CI)

/**
 * E2E는 프로덕션 빌드를 띄워서 검증한다(admin: vite preview, web: next start).
 * 빌드는 turbo가 먼저 수행한다: pnpm test:e2e → turbo run build → playwright test
 * 로컬에서는 설치된 Edge를 쓰고(브라우저 다운로드 불필요), CI에서는 Playwright Chromium을 쓴다.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: 1,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'ko-KR',
  },
  projects: [
    {
      name: 'admin',
      testMatch: /admin\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        ...(CI ? {} : { channel: 'msedge' }),
        baseURL: 'http://localhost:4173',
      },
    },
    {
      name: 'web',
      testMatch: /web\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        ...(CI ? {} : { channel: 'msedge' }),
        baseURL: 'http://localhost:3000',
      },
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter @lms/admin preview --strictPort',
      url: 'http://localhost:4173/login',
      // 이미 떠 있는 서버는 이전 빌드일 수 있어(Server Action ID 불일치) 항상 새로 띄운다.
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: 'pnpm --filter @lms/web start',
      url: 'http://localhost:3000',
      // 이미 떠 있는 서버는 이전 빌드일 수 있어(Server Action ID 불일치) 항상 새로 띄운다.
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
})
