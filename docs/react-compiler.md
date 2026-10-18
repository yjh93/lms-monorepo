# React Compiler 적용 기록 (apps/admin)

- 적용일: 2026-10-18
- 도구: `babel-plugin-react-compiler` 1.0 + `@rolldown/plugin-babel` (`@vitejs/plugin-react` 6의 `reactCompilerPreset`)
- Rust 포트(`react({ compiler: true })`, oxc)는 공식 문서에 실험 단계로 표시돼 있어 안정 버전인 Babel 경로를 택했다.
- 켜고 끄기: `REACT_COMPILER=false`면 컴파일러 없이 빌드/테스트한다 (`apps/admin/vite.config.ts`).

## 무엇을 측정했나

같은 사용자 시나리오를 컴파일러 적용 전후로 실행하고, **실제로 함수 본문이 다시 실행된 컴포넌트 수**를 셌다.

- 시나리오(수강생 목록, ADMIN): 상태 필터 2회 → 이름 정렬 → 다음 페이지 → 검색어 1글자 입력(300ms 디바운스).
  각 단계마다 서버 응답이 반영될 때까지 기다린다.
- 측정 방법: React DevTools 전역 훅(`__REACT_DEVTOOLS_GLOBAL_HOOK__`)을 흉내 내 커밋마다 Fiber 트리를 순회하고,
  "직전 커밋에 없던 Fiber 객체이면서 `PerformedWork` 플래그가 켜진 함수 컴포넌트"만 렌더로 집계했다.
  DevTools의 "Highlight updates"와 같은 판정 방식이다. → `apps/admin/src/perf/devtoolsHook.ts`
- 밀리초 대신 렌더 횟수를 쓴 이유: jsdom 위의 시간 측정은 편차가 커서 비교 근거로 약하다. 렌더 횟수는 실행할 때마다 같은 값이 나온다.
- 재현: `pnpm --filter @lms/admin perf:compiler`. 렌더 측정과 프로덕션 빌드를 전후 각각 실행하고 아래 표를 출력한다.

## 결과

| 컴포넌트               |  적용 전 |  적용 후 |    변화 |
| ---------------------- | -------: | -------: | ------: |
| StudentListPage        |       10 |       10 |      0% |
| StudentFilters         |       11 |        6 |    -45% |
| PageHeader             |       10 |        0 |   -100% |
| CheckboxGroup          |       22 |       10 |    -55% |
| Input                  |       11 |        1 |    -91% |
| Select                 |       21 |       10 |    -52% |
| Field                  |       32 |       11 |    -66% |
| Button                 |       51 |       25 |    -51% |
| DataTable              |       10 |       10 |      0% |
| Badge                  |       98 |       98 |      0% |
| SortIcon               |       40 |       40 |      0% |
| Link                   |      118 |      118 |      0% |
| **전체 컴포넌트 렌더** | **2177** | **2062** | **-5%** |

| 번들(JS 합계) |   적용 전 |   적용 후 | 변화 |
| ------------- | --------: | --------: | ---: |
| raw           | 1384.1 KB | 1406.1 KB |  +2% |
| gzip          |  449.5 KB |  458.9 KB |  +2% |

> `@lms/ui`는 빌드된 `dist`를 쓰지만, pnpm 워크스페이스 링크가 실제 경로(`packages/ui/dist`)로 해석되고
> 플러그인 기본 exclude는 `node_modules`뿐이라서 ui 컴포넌트도 admin 빌드에서 함께 컴파일된다.

## 해석

**효과가 컸던 곳: 데이터와 무관한 형제 서브트리**

- 목록 화면은 조회가 시작되고(`isFetching: true`) 끝날 때마다 `StudentListPage`가 다시 렌더된다.
  컴파일러 적용 전에는 그때마다 헤더, 필터 패널, 버튼까지 전부 다시 렌더됐다.
- 컴파일러는 props가 같은 JSX 엘리먼트를 캐시해서 이 서브트리를 건너뛴다.
  `PageHeader`는 10회에서 0회로, 검색 `Input`은 11회에서 1회로 줄었다. 남은 1회는 직접 입력해서 값이 바뀐 경우다.
- 같은 효과를 수동으로 내려면 `memo()`와 `useCallback`을 여러 곳에 넣어야 한다. 컴파일러는 코드 변경 없이 이를 얻는다.

**효과가 없던 곳: 데이터 테이블의 셀**

- 전체 감소율이 5%에 그친 이유는 렌더 대부분(`Link`, `Badge`, `SortIcon`, 셀 렌더러)이 테이블 안에서 일어나기 때문이다.
- `DataTable`은 `isLoading`, `data`, `sorting` props가 실제로 바뀌므로 다시 렌더되는 게 맞다.
- TanStack Table은 렌더마다 셀 컨텍스트 객체를 새로 만들어 셀 렌더러에 넘긴다.
  그래서 컴파일러가 셀 단위로 캐시할 수 없다. 컴파일러는 라이브러리 내부의 객체 동일성까지 바꿔 주지는 않는다.
- 개선 후보: 조회 중(`isFetching`)에는 데이터가 그대로인데도 행이 다시 렌더된다.
  `DataTable`의 행을 "행 원본 데이터 + 선택 상태"를 props로 받는 별도 컴포넌트로 분리하면,
  이전 데이터를 유지하는 동안의 셀 재렌더 대부분을 없앨 수 있다(UI 패키지 변경이 필요해 별도 작업으로 남김).

**비용**

- 메모 캐시 코드 때문에 번들이 약 2%(gzip 9KB) 커졌다.
- 이 앱처럼 폼과 필터가 많고 서버 상태가 자주 바뀌는 어드민에서는 수용할 만한 비용으로 판단했다.

## 컴파일러 때문에 바꾼 코드

`eslint-plugin-react-hooks` 7의 컴파일러 진단(`react-hooks/incompatible-library`)이 다음 문제를 찾아냈다.

```tsx
// Before: RHF의 watch()는 메모이제이션할 수 없는 API라 컴파일러가 이 컴포넌트 최적화를 건너뛴다.
const selectedRole = watch('role')

// After: 구독 기반 useWatch는 컴파일러와 호환된다.
const selectedRole = useWatch({ control, name: 'role' })
```

- 린트 진단 덕분에 이 문제가 빌드 전에 드러났다. 컴파일러를 도입할 때는 "컴파일되지 않고 조용히 건너뛰는 컴포넌트"를 찾는 게 핵심이다.
- 기존의 수동 `useMemo`/`useCallback`(예: `useStudentListParams`)은 그대로 두었다. 컴파일러는 기존 메모이제이션을 존중하고,
  이 훅의 반환값은 TanStack Table 상태 어댑터로 쓰여 참조 동일성 의도를 코드에 드러내는 편이 읽기 쉽다.
  새로 작성하는 코드에서는 수동 메모이제이션을 생략한다.

## 결론

- 기본값으로 켠다. 형제 서브트리의 불필요한 재렌더가 코드 변경 없이 사라지고, 비용은 번들 2% 수준이다.
- 다만 "컴파일러를 켜면 다 빨라진다"는 기대와 달리, 실제 렌더 대부분을 차지하는 데이터 테이블은 컴포넌트 경계를 다시 설계해야 효과를 본다.
  측정해 보기 전에는 알 수 없던 결과라서, 이 측정 도구(`perf:compiler`)를 함께 남긴다.
