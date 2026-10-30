import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { setupApiClient } from './app/apiClient'
import { App } from './app/App'
import './index.css'

setupApiClient(import.meta.env.VITE_API_BASE_URL ?? '/api')

/**
 * 백엔드 없이 동작하도록 MSW 서비스 워커를 먼저 띄운 뒤 렌더링한다.
 * 백엔드 없이 배포하는 데모 환경에서도 목 API를 쓰므로 production에서도 기본 활성화.
 */
async function enableMocking() {
  if (import.meta.env.VITE_API_MOCKING === 'disabled') return
  const { worker } = await import('./mocks/browser')
  await worker.start({
    onUnhandledFrame: 'bypass',
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  })
}

await enableMocking()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
