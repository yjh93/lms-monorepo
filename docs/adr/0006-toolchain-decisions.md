# ADR 0006. 버전·도구 결정 기록

- 상태: 채택
- 날짜: 2026-10-16 ~ 2026-10-30

설치 시점의 최신 안정 버전을 쓰되, 호환성 때문에 다르게 고른 것과 도구 설정상의 결정을 기록한다.

| 항목            | 결정                                                              | 이유                                                                                                                                                                       |
| --------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript      | **6.0.3 고정** (최신 7.0)                                         | typescript-eslint 8.x가 `<6.1`만 지원. 7.0으로 올리면 타입 기반 린트가 동작하지 않는다                                                                                     |
| Node.js         | `engines >=22.12`, CI는 `.nvmrc` 24                               | 로컬에서 turbo 하위 프로세스가 Node 22로 실행되는 환경이 있었다                                                                                                            |
| TanStack Table  | v9 `tableFeatures()` API                                          | 필요한 기능(정렬·페이지네이션)만 등록, 정렬·자르기는 서버(manual 모드)                                                                                                     |
| MSW             | 3.x + 기존 `setupWorker` + `public/mockServiceWorker.js`          | 3.x의 Vite 플러그인은 `msw/experimental` 기반이라 사용하지 않음. `onUnhandledRequest` → `onUnhandledFrame` 변경 반영                                                       |
| MSW 사전 번들링 | `optimizeDeps.include: ['msw', 'msw/browser']`                    | 개발 중 의존성 재최적화로 두 모듈이 다른 인스턴스가 되면 목 요청이 404가 됐다                                                                                              |
| React Compiler  | Babel 플러그인(admin), Next `reactCompiler`(web)                  | Rust 포트(oxc)는 실험 단계                                                                                                                                                 |
| 패키지 참조     | `exports`에 `@lms/source` 조건                                    | 빌드 전·빌드 중 에디터 타입 오류(`Cannot find module '@lms/api-client'`) 제거, 개발 서버·테스트도 빌드 불필요. Turbopack은 사용자 조건을 지원하지 않아 `resolveAlias` 사용 |
| 라이브러리 빌드 | `tsc` 전 `dist` 삭제                                              | 남아 있던 `dist/mocks/handlers.js`가 새 `handlers/` 폴더보다 먼저 해석된 적이 있다                                                                                         |
| Next.js 캐싱    | Cache Components(`cacheComponents: true`)                         | `'use cache'` + `cacheLife`/`cacheTag`로 데이터별 수명을 명시하고, 정적 셸 + 스트리밍 구성                                                                                 |
| 좌석 캐시       | `cacheLife('seconds')` + `updateTag`                              | 수명이 짧은 캐시는 정적 셸에서 빠져 요청 시 스트리밍된다. 신청 직후에는 `updateTag`로 즉시 만료(read-your-own-writes)                                                      |
| 없는 강좌 404   | `proxy.ts`에서 rewrite                                            | Cache Components는 셸을 먼저 200으로 보내 페이지 안의 `notFound()`로는 상태 코드를 바꿀 수 없다(`dynamicParams`도 사용 불가)                                               |
| 목록 로딩 UI    | `courses/(list)/loading.tsx` 라우트 그룹                          | 상세까지 감싸면 로딩 셸이 먼저 전송된다                                                                                                                                    |
| 테스트 실행     | 패키지 순차 실행(`--concurrency=1`, CI는 2)                       | 메모리 8GB 환경에서 jsdom 워커 시작이 실패했다                                                                                                                             |
| E2E 브라우저    | 로컬은 설치된 Edge(`channel: 'msedge'`), CI는 Playwright Chromium | 로컬에서 브라우저 바이너리를 따로 받지 않는다                                                                                                                              |
