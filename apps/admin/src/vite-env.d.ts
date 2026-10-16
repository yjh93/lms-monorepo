/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'disabled'이면 MSW를 끄고 실제 API(VITE_API_BASE_URL)로 요청한다. */
  readonly VITE_API_MOCKING?: 'enabled' | 'disabled'
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
