# ADR 0005. React 18 대비 React 19에서 활용한 기능

- 상태: 채택
- 날짜: 2026-10-18

## 결정과 적용 위치

| 기능                    | 적용 위치                                     | React 18이었다면                                                  |
| ----------------------- | --------------------------------------------- | ----------------------------------------------------------------- |
| **ref as prop**         | `@lms/ui` Button·Input·Select                 | `forwardRef`로 감싸고 displayName을 따로 지정                     |
| **`useOptimistic`**     | 출석 체크(`LessonDetailPage`)                 | 이전 값을 저장해 두고 `onError`에서 수동 롤백                     |
| **`useActionState`**    | 수강 신청 폼(`EnrollForm`, Server Action)     | `useState`로 pending·에러·결과를 각각 관리, 제출 핸들러 직접 작성 |
| **`<form action>`**     | 수강 신청                                     | JS 로드 전 제출 불가                                              |
| **`use(Context)`**      | 출석 분석 클라이언트 주입(`analyticsQueries`) | `useContext` (조건부 호출 불가)                                   |
| **Context as provider** | `<AnalyticsClientContext value>`              | `<Context.Provider value>`                                        |
| **React Compiler**      | admin, web                                    | `memo`·`useMemo`·`useCallback` 수동 최적화                        |

## 근거

### `useOptimistic` + `useTransition` (출석 체크)

- 클릭 즉시 낙관적 값을 보여주고, 서버 응답 전까지 "저장 중"을 표시한다.
- 성공하면 mutation `onSuccess`가 서버 응답으로 TanStack Query 캐시를 확정한다. transition이 끝나면 낙관적 값이 확정된 값으로 자연스럽게 교체된다.
- 실패하면 캐시는 그대로이므로 transition이 끝나는 순간 원래 값으로 돌아간다. **롤백 코드가 없다.**
- 데모용 "저장 실패 시뮬레이션"으로 롤백을 화면에서 확인할 수 있다.

### `useActionState` + Server Action (수강 신청)

- Server Action이 `(이전 상태, FormData) → 다음 상태`를 반환하고, 폼은 그 상태(필드 에러, 입력값, 접수 결과)만 그린다.
- `pending`이 내장되어 버튼 로딩 처리가 간단하다.
- 검증 실패 시 서버가 입력값을 돌려주고, 폼 `key`를 바꿔 `defaultValue`를 다시 적용한다.

### React Compiler

- admin은 Babel 플러그인(`babel-plugin-react-compiler` 1.0), web은 Next의 `reactCompiler` 옵션으로 적용했다.
- 측정 결과 헤더·필터처럼 데이터와 무관한 형제 서브트리의 재렌더가 45~100% 줄었고, 테이블 셀은 줄지 않았다 → [react-compiler.md](../react-compiler.md)
- 컴파일러 린트가 RHF `watch()`처럼 메모이제이션할 수 없는 API를 잡아내 `useWatch`로 바꿨다.

## 결과

- 새 코드에서는 수동 `useMemo`/`useCallback`을 쓰지 않는다. 기존 코드는 의도를 드러내는 경우(테이블 상태 어댑터)에만 남겨 둔다.
- 서드파티 중 메모이제이션 불가 API(TanStack Virtual 등)는 린트 예외로 명시한다.
