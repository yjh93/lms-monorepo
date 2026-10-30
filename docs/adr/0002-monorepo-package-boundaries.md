# ADR 0002. 모노레포 패키지 분리 기준

- 상태: 채택
- 날짜: 2026-10-16

## 맥락

앱 세 개(admin, web, legacy-admin)가 도메인 규칙·UI·설정을 공유한다. 너무 잘게 나누면 버전·빌드 관리 비용이 커지고, 한 패키지에 몰면 앱이 필요 없는 의존성(React, MSW 등)까지 끌고 간다.

## 결정

패키지는 두 가지 질문으로 나눈다.

1. **둘 이상의 앱이 쓰는가?** 한 앱만 쓰면 그 앱 안에 둔다(예: 출석 분석 엔진은 admin 내부).
2. **특정 프레임워크·런타임에 묶이는가?** 묶이는 코드는 별도 엔트리로 분리한다.

| 패키지                     | 내용                                               | 의존                         |
| -------------------------- | -------------------------------------------------- | ---------------------------- |
| `@lms/config`              | tsconfig 프리셋, ESLint flat config, Tailwind 토큰 | 없음(설정만)                 |
| `@lms/utils`               | 포맷 함수, 권한표(`can`)                           | date-fns                     |
| `@lms/api-client`          | 기본 엔트리: zod 스키마, 타입, fetch 함수          | zod, `@lms/utils`            |
| `@lms/api-client/query`    | TanStack Query 키·`queryOptions`·훅                | React, TanStack Query (peer) |
| `@lms/api-client/mocks`    | MSW 핸들러, 시드 DB                                | MSW (peer, optional)         |
| `@lms/api-client/fixtures` | 강좌 시드 데이터                                   | 없음                         |
| `@lms/ui`                  | React 컴포넌트, Storybook                          | React (peer), TanStack Table |

## 근거

- **엔트리 분리**: Next.js 서버 코드와 Vue 레거시 앱은 기본 엔트리(스키마·fetch)만 import한다. React Query나 MSW가 그 번들에 섞이지 않는다.
- **권한표를 utils에**: 화면(메뉴·버튼·라우트 가드)과 목 서버(401/403)가 같은 `can()`을 써서 클라이언트와 서버 규칙이 어긋나지 않는다.
- **도메인 스키마를 api-client에**: 폼 검증, URL 쿼리 파싱, 목 서버의 요청 검증이 같은 스키마를 공유한다 → [ADR 0004](0004-shared-form-schemas.md)

## 결과

- **소스 참조**: 각 패키지 `exports`에 `@lms/source` 조건(→ `src`)을 두고, tsconfig `customConditions`와 Vite `resolve.conditions`, Next `turbopack.resolveAlias`로 소스를 직접 참조한다. 패키지를 빌드하지 않아도 에디터·개발 서버·테스트가 동작하고, 배포 빌드에서만 `dist`를 쓴다.
- **빌드 파이프라인**: Turborepo `build`는 `^build`에 의존하고, 테스트·스토리 파일은 build 입력에서 제외해 캐시 적중률을 높인다. `typecheck`는 소스를 참조하므로 빌드를 기다리지 않는다.
- **변경 기록**: 공용 패키지 변경은 changesets로 남긴다.
