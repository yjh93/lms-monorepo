# ADR 0004. 폼 스키마는 zod로 정의해 클라이언트와 서버가 공유한다

- 상태: 채택
- 날짜: 2026-10-16

## 맥락

같은 입력(수강생 정보, 수강 신청)이 여러 경로로 들어온다: 어드민 등록/수정 폼, CSV 일괄 업로드, 목 서버 API, 학습자 사이트 Server Action. 규칙이 각자 구현되면 메시지·허용 범위가 어긋난다.

## 결정

- 스키마는 `@lms/api-client`에 zod로 한 번 정의한다(`studentFormSchema`, `enrollmentFormSchema`, 목록 쿼리 스키마).
- 여러 폼이 공유하는 필드 규칙(이름·이메일·휴대폰)은 `schemas/fields.ts`로 분리한다.
- 사용처:

| 사용처        | 방식                                                         |
| ------------- | ------------------------------------------------------------ |
| 어드민 폼     | react-hook-form + `zodResolver(studentFormSchema)`           |
| CSV 업로드    | 행마다 `studentFormSchema.safeParse`                         |
| 목 서버(MSW)  | 같은 스키마로 재검증 → 422 + `fieldErrors`                   |
| 학습자 사이트 | Server Action에서 `enrollmentFormSchema.safeParse(FormData)` |
| URL 쿼리      | 브라우저(admin·legacy)와 목 서버가 같은 파서 사용            |

## 근거

- **입력 타입 ≠ 출력 타입**: 휴대폰은 "010-1234-5678"을 받아 숫자만 저장한다. `z.input`/`z.output`을 구분하고 `useForm<Input, unknown, Output>`으로 폼 값과 제출 값을 정확히 타이핑한다.
- **서버 재검증**: 클라이언트 검증은 사용성일 뿐이다. 같은 스키마로 서버(목 서버, Server Action)가 다시 검증해 우회 요청을 막는다.
- **서버 에러를 폼 필드로**: 서버가 돌려준 `fieldErrors`(예: 이메일 중복 409)를 `setError`로 같은 필드에 표시한다. Server Action은 필드 에러와 입력값을 상태로 돌려줘 JS 없이 제출해도 입력이 유지된다.
- **URL은 방어적으로**: 쿼리 스키마는 `.catch()`로 잘못된 값만 기본값으로 바꾼다. 사용자가 URL을 고쳐도 화면이 깨지지 않는다.

## 결과

- 메시지 한 곳만 고치면 모든 경로에 반영된다. 테스트도 스키마 단위(정규화·메시지·왕복 변환)로 작성한다.
- zod가 클라이언트 번들에 포함된다(어드민·학습자 폼). 이 프로젝트에서는 검증 일관성이 번들 크기보다 중요하다고 판단했다.
