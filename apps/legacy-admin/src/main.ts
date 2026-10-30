import { configureApiClient, DEMO_USER_HEADER } from '@lms/api-client'
import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

/**
 * 레거시 어드민은 로그인 화면 없이 관리자 데모 계정으로 동작한다.
 * API 클라이언트·목 서버는 React 어드민과 같은 패키지를 쓴다.
 */
configureApiClient({ baseUrl: '/api', getHeaders: () => ({ [DEMO_USER_HEADER]: 'usr_admin' }) })

async function enableMocking() {
  const [{ setupWorker }, { handlers }] = await Promise.all([
    import('msw/browser'),
    import('@lms/api-client/mocks'),
  ])
  await setupWorker(...handlers).start({ onUnhandledFrame: 'bypass' })
}

await enableMocking()
createApp(App).mount('#app')
