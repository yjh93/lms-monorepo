# LMS Monorepo

기업 어학교육 운영사의 업무를 다루는 프론트엔드 모노레포다. 운영자가 쓰는 **어드민 SPA**, 학습자가 쓰는 **강좌 소개·수강 신청 사이트**, 점진적 마이그레이션 대상인 **레거시 Vue 어드민**이 공용 패키지를 함께 쓴다. 백엔드 없이 동작하도록 API는 MSW(어드민)와 Next.js 서버(학습자 사이트)가 목 데이터로 제공한다.

## 구조

```
lms-monorepo/
├─ apps/
│  ├─ admin/          운영 어드민 SPA          React 19 · Vite · React Router · TanStack Query/Table/Virtual · Zustand
│  ├─ web/            학습자 사이트            Next.js 16 App Router · Server Components · Server Actions
│  └─ legacy-admin/   레거시 어드민(1화면)     Vue 3 · 공용 api-client 재사용
├─ packages/
│  ├─ ui/             공용 컴포넌트 + Storybook (Button, Input, Select, Modal, Badge, DataTable)
│  ├─ api-client/     zod 스키마 · fetch 함수 · TanStack Query 훅 · MSW 핸들러 · 시드 데이터
│  ├─ utils/          날짜·숫자 포맷, 권한(RBAC) 매핑
│  └─ config/         tsconfig · ESLint · Tailwind 디자인 토큰
├─ e2e/               Playwright (admin, web)
└─ docs/              ADR · 화면 가이드 · 측정 기록 · 마이그레이션 전략
```

```
           ┌──────────── @lms/config (tsconfig · eslint · tailwind tokens) ────────────┐
           │                                                                            │
 @lms/utils ──▶ @lms/api-client ──┬──▶ apps/admin  ◀── @lms/ui ──▶ apps/web
                (schemas · fetch)  ├──▶ apps/web       (React)
                 /query  /mocks    └──▶ apps/legacy-admin (Vue: 프레임워크 비의존 엔트리만 사용)
```

## 주요 기능

**어드민 (`apps/admin`)**

- 목 로그인과 역할(관리자 / 운영 매니저 / 강사)별 권한: 라우트 가드, 버튼·메뉴 권한, 목 서버의 401/403과 행 단위 권한
- 수강생 목록: 서버 페이지네이션·정렬·다중 필터·검색, 상태는 URL 쿼리와 동기화
- 수강생 등록/수정 폼(react-hook-form + 공유 zod 스키마), CSV 일괄 등록(행 단위 검증·오류 리포트·EUC-KR 지원)
- 수업/출석: `useOptimistic`으로 즉시 반영, 실패 시 자동 복구
- 대시보드(KPI·출석률 추이·고객사별 현황), 변경 이력(필드 단위 이전→이후)
- 출석 분석: 30만 건을 Web Worker에서 필터·집계·정렬, 히트맵 교차 필터, 가상 스크롤 목록
- React Compiler 적용과 전후 렌더 횟수 측정

**학습자 사이트 (`apps/web`)**

- 강좌 목록/상세: Server Components, `'use cache'` + `cacheLife`/`cacheTag`, 정적 셸 + 스트리밍
- SEO: `generateMetadata`, canonical, JSON-LD, 강좌별 OG 이미지, sitemap, robots
- 수강 신청: Server Action + `useActionState`, 공유 zod 스키마로 서버 검증, `updateTag`로 좌석 즉시 갱신
- loading / error / not-found, 없는 강좌는 proxy에서 실제 404

## 실행

요구 사항: Node.js 22.12+ (CI는 24), pnpm 10

```bash
pnpm install

pnpm --filter @lms/admin dev          # http://localhost:5173  (로그인 화면에서 역할 선택)
pnpm --filter @lms/web dev            # http://localhost:3000
pnpm --filter @lms/legacy-admin dev   # http://localhost:5174
pnpm --filter @lms/ui storybook       # http://localhost:6006
```

워크스페이스 패키지는 소스를 직접 참조하므로(`@lms/source` 조건) 패키지를 먼저 빌드할 필요가 없다.

| 명령                                     | 내용                                             |
| ---------------------------------------- | ------------------------------------------------ |
| `pnpm lint` / `pnpm typecheck`           | 전체 린트 / 타입 검사                            |
| `pnpm test`                              | 전체 단위·통합 테스트 (Vitest, 패키지 순차 실행) |
| `pnpm build`                             | 전체 빌드 (turbo 캐시)                           |
| `pnpm test:e2e`                          | admin·web 빌드 후 Playwright E2E                 |
| `pnpm --filter @lms/admin perf:compiler` | React Compiler 적용 전후 렌더 횟수·번들 비교     |
| `pnpm changeset`                         | 공용 패키지 변경 기록                            |

## 기술 선택

| 결정                                  | 이유                                                                                              | 문서                                                     |
| ------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 어드민은 SPA, 학습자 사이트는 Next.js | 로그인 뒤 상호작용 중심 화면과, 검색 노출·첫 화면 속도가 중요한 공개 화면은 요구가 다르다         | [ADR 0001](docs/adr/0001-admin-spa-web-nextjs.md)        |
| 패키지 분리 기준                      | "여러 앱이 쓰는가", "프레임워크에 묶이는가"로 나눈다                                              | [ADR 0002](docs/adr/0002-monorepo-package-boundaries.md) |
| 서버 상태는 TanStack Query            | 캐시·무효화·재시도·낙관적 업데이트를 한 모델로. 클라이언트 상태(Zustand)·URL 상태와 역할을 나눈다 | [ADR 0003](docs/adr/0003-server-state-tanstack-query.md) |
| 폼 스키마 공유                        | 클라이언트 폼, 목 서버, CSV, Server Action이 같은 zod 스키마로 검증                               | [ADR 0004](docs/adr/0004-shared-form-schemas.md)         |
| React 19 기능                         | ref as prop, `useOptimistic`, `useActionState`, `use`, React Compiler                             | [ADR 0005](docs/adr/0005-react-19-features.md)           |
| 버전·도구 결정                        | TypeScript 6 고정, MSW 3, Cache Components, 소스 참조 조건 등                                     | [ADR 0006](docs/adr/0006-toolchain-decisions.md)         |

## 품질

- 테스트: Vitest + Testing Library(컴포넌트·화면 통합, MSW로 실제 네트워크 경로 사용), Playwright E2E
- CI(GitHub Actions): PR마다 변경된 패키지와 그 의존 패키지만 lint · typecheck · test · build, turbo 캐시 보존, 이어서 E2E
- 접근성: 역할·레이블 기반 테스트 쿼리, 폼 에러의 `aria-describedby`, 차트의 표 보기
- 기록: [화면 가이드](docs/admin-pages.md) · [React Compiler 측정](docs/react-compiler.md) · [대용량 분석](docs/large-data.md) · [Vue → React 마이그레이션](docs/migration.md)
