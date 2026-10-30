# 어드민 화면 가이드

`apps/admin`의 화면별 기능, 동작 방식, 관련 코드와 테스트를 정리한다.

## 실행

```bash
pnpm install
pnpm --filter @lms/admin dev   # http://localhost:5173
```

- 로그인 화면에서 역할(관리자 / 운영 매니저 / 강사)을 고르면 해당 데모 계정으로 접속한다.
- API는 MSW 목 서버가 처리한다. 데이터는 브라우저 메모리에 있어 새로고침하면 초기 상태로 돌아간다.

## 화면 목록

| 화면               | 경로                                  | 권한                      |
| ------------------ | ------------------------------------- | ------------------------- |
| 로그인             | `/login`                              | 전체                      |
| 대시보드           | `/dashboard`                          | 관리자, 운영 매니저       |
| 수강생 목록        | `/students`                           | 전체 (강사는 조회만)      |
| 수강생 등록 / 수정 | `/students/new`, `/students/:id/edit` | 관리자, 운영 매니저       |
| CSV 일괄 등록      | `/students/import`                    | 관리자, 운영 매니저       |
| 수업 / 출석        | `/lessons`, `/lessons/:id`            | 전체 (강사는 본인 수업만) |
| 출석 분석          | `/analytics`                          | 관리자, 운영 매니저       |
| 변경 이력          | `/audit-logs`                         | 관리자                    |

---

## 로그인 · 권한(RBAC)

- 관련 코드: `packages/utils/src/permission.ts`(권한표), `apps/admin/src/auth/`, `packages/api-client/src/mocks/http-utils.ts`(`authorize`)
- 테스트: `apps/admin/src/auth/auth.test.tsx`, `packages/api-client/src/mocks/handlers/*.test.ts`

동작

- 화면은 역할이 아니라 권한으로 분기한다(`can(role, 'student:create')`). 역할 구성이 바뀌어도 권한표만 수정하면 된다.
- 메뉴, 버튼, 라우트 가드(`RequirePermission`)가 같은 권한표를 쓴다. 권한이 없는 경로에 직접 접근하면 403 화면을 보여준다.
- 목 서버도 같은 권한표로 401/403을 반환한다. 강사는 본인 수업만 조회하고 출석 체크할 수 있다(행 단위 권한).
- 인증 상태는 `useSyncExternalStore` 기반 외부 스토어(`authStore`)에 둔다. API 헤더 주입이나 401 자동 로그아웃처럼 React 밖에서도 읽고 써야 하기 때문이다.
- 401 응답을 받으면 로그아웃하고, 다시 로그인하면 원래 보던 주소로 돌아간다. 사용자가 직접 로그아웃한 경우에는 역할별 첫 화면으로 이동한다.
- 로그인·로그아웃 때 React Query 캐시를 비워 이전 사용자의 데이터가 남지 않게 한다.

---

## 대시보드

- 관련 코드: `apps/admin/src/features/dashboard/`, `packages/api-client/src/mocks/handlers/dashboard.ts`(집계)
- 테스트: `DashboardPage.test.tsx`

동작

- KPI 4개, 최근 8주 주간 출석률 추이, 고객사별 수강 상태 현황을 보여준다.
- 범주형 4색은 색각이상 시뮬레이션 검증(인접 쌍 ΔE ≥ 9)을 통과한 고정 순서로 배정한다. 계열 수가 바뀌어도 색이 재배정되지 않는다.
- 흰 배경 대비 3:1 미만인 색이 있어 범례와 "표로 보기"를 함께 제공한다. 출석률 변화는 색과 함께 화살표·부호·문구로 표시한다.
- 라인 차트는 마지막 값만 직접 표기하고, 나머지는 툴팁과 표로 제공한다.

---

## 수강생 목록

- 관련 코드: `apps/admin/src/features/students/useStudentListParams.ts`, `packages/api-client/src/schemas/common.ts`(`createSearchParamsCodec`), `packages/api-client/src/schemas/student.ts`
- 테스트: `StudentListPage.test.tsx`, `packages/api-client/src/schemas/student.test.ts`

동작

- 페이지, 정렬, 필터, 검색 상태는 URL 쿼리에만 저장한다. 새로고침, 링크 공유, 뒤로가기에도 같은 화면이 유지된다.
- URL 파싱/직렬화 스키마를 목 서버의 요청 파싱과 공유한다. 잘못된 값은 `.catch()`로 해당 항목만 기본값으로 바꾼다.
- 필터나 정렬을 바꾸면 1페이지로 돌아간다. 검색어는 300ms 디바운스하고, 브라우저 히스토리를 쌓지 않도록 `replace`로 반영한다.
- 서버 페이지네이션에 `keepPreviousData`를 적용해 페이지 전환 중 이전 결과를 유지한다.
- 테이블은 TanStack Table v9를 감싼 `@lms/ui`의 `DataTable`이다. 정렬·페이지네이션 기능만 등록하고, 상태는 바깥에서 관리한다(controlled).

---

## 수강생 등록 / 수정

- 관련 코드: `apps/admin/src/features/students/StudentForm.tsx`, `packages/api-client/src/schemas/student.ts`(`studentFormSchema`)
- 테스트: `StudentForm.test.tsx`, `packages/api-client/src/mocks/handlers/students.test.ts`

동작

- 검증 규칙은 `studentFormSchema` 하나다. 폼(react-hook-form), 목 서버 재검증, CSV 업로드가 같은 스키마를 쓴다.
- 전화번호는 "010-1234-5678" 형식으로 입력받고 숫자만 저장한다. 입력 타입과 출력 타입이 달라 `useForm<Input, unknown, Output>`으로 구분한다.
- 서버가 돌려준 `fieldErrors`(예: 이메일 중복 409)는 `setError`로 해당 필드에 표시한다.

---

## CSV 일괄 등록

- 관련 코드: `apps/admin/src/features/students/import/studentCsv.ts`, `StudentImportPage.tsx`
- 테스트: `studentCsv.test.ts`, `StudentImportPage.test.tsx`

동작

- 양식 파일을 내려받아 작성한 뒤 업로드한다. 헤더와 레벨·상태 값은 한글 라벨과 영문 코드를 모두 허용한다.
- 행 단위 검증은 순수 함수(`parseStudentCsv`)로 분리돼 있다. 등록 폼과 같은 스키마로 검증하고, 파일 안의 이메일 중복도 잡는다.
- 엑셀에서 저장한 CSV는 CP949(EUC-KR)인 경우가 많아, UTF-8로 엄격하게 먼저 디코딩하고 실패하면 EUC-KR로 다시 읽는다.
- 정상 행만 등록한다(부분 성공). 서버가 거절한 행(이미 등록된 이메일)은 원래 행 번호에 표시하고 오류 리포트에도 포함한다.

---

## 수업 / 출석

- 관련 코드: `apps/admin/src/features/lessons/LessonDetailPage.tsx`, `packages/api-client/src/query/lessons.ts`(`useUpdateAttendance`)
- 테스트: `LessonDetailPage.test.tsx`

동작

- 주 단위로 수업을 조회한다(`?week=YYYY-MM-DD`). 관리자·매니저는 강사별로 필터링할 수 있다.
- 출석 체크는 React 19 `useOptimistic` + `useTransition`으로 즉시 반영한다. 성공하면 서버 응답으로 캐시를 확정하고, 실패하면 transition이 끝날 때 이전 상태로 돌아간다(별도의 롤백 코드 없음).
- "저장 실패 시뮬레이션"을 켜면 목 서버가 500을 반환해 실패 시 동작을 확인할 수 있다.
- 미래 수업과 휴강 수업은 서버가 409를 반환하고, 화면에서도 버튼을 비활성화한다.

---

## 출석 분석

- 관련 코드: `apps/admin/src/features/analytics/` (엔진: `engine/`, 상태: `analyticsStore.ts`, 쿼리: `analyticsQueries.ts`)
- 테스트: `engine/engine.test.ts`, `AnalyticsPage.test.tsx`
- 설계와 측정: [large-data.md](large-data.md)

동작

- 최근 1년 출석 기록 30만 건을 Web Worker 안에서 열 단위 TypedArray로 만들고, 필터·집계·정렬을 모두 워커에서 처리한다.
- TanStack Query가 워커 호출을 감싸 필터 조합별 집계를 캐시하고, 목록은 커서 기반 `useInfiniteQuery`로 200건씩 받는다.
- 필터·정렬·히트맵 선택은 Zustand 스토어에 둔다(탐색 중 자주 바뀌는 일시 상태).
- 요일×시간대 히트맵 셀을 누르면 KPI·차트·목록이 함께 필터링된다(교차 필터).
- 목록은 TanStack Virtual로 보이는 행만 그린다.
- 화면 코드는 이 경로에 처음 들어올 때 내려받는다(라우트 단위 코드 분할).

---

## 변경 이력(감사 로그)

- 관련 코드: `packages/api-client/src/mocks/handlers/students.ts`(`diffStudent`), `apps/admin/src/features/audit/AuditLogPage.tsx`
- 테스트: `AuditLogPage.test.tsx`

동작

- 수강생 등록·수정·일괄 등록, 출석 변경을 기록한다. 작업 종류와 작업자 역할로 필터링한다.
- 기록 주체는 요청 헤더의 사용자이고, 기록은 서버(목) 쪽에서 남긴다.
- 바뀐 필드만, 읽기 쉬운 값(레벨·상태 라벨, 전화번호 형식)으로 "이전 → 이후"를 저장한다.

---

## 공통 사항

- **디자인 토큰**: 색, 라운드, 폰트는 `packages/config/tailwind/theme.css`에서 관리한다. Tailwind의 gray 스케일을 쿨그레이로 교체해 전체 톤을 맞춘다. 컴포넌트 문서는 Storybook(`pnpm --filter @lms/ui storybook`)에 있다.
- **React Compiler**: 적용 전후 측정 기록은 `docs/react-compiler.md`에 있다.
- **워크스페이스 패키지 참조**: `@lms/source` 조건으로 패키지 소스를 직접 참조한다. 패키지를 빌드하지 않아도 에디터 타입 검사, 개발 서버, 테스트가 동작하고, 배포 빌드만 `dist`를 쓴다.
