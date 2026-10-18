import { ROLES } from '@lms/utils'
import { z } from 'zod'

export const roleSchema = z.enum(ROLES)

export const authUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  role: roleSchema,
  /** TEACHER 역할일 때 연결된 강사 ID. 본인 수업만 조회/출석 체크할 수 있다. */
  teacherId: z.string().nullable(),
})
export type AuthUser = z.infer<typeof authUserSchema>

/** 목 로그인: 이메일/비밀번호 형식만 검증하고, 선택한 역할의 데모 계정으로 로그인한다. */
export const loginFormSchema = z.object({
  email: z.string().trim().pipe(z.email('이메일 형식이 올바르지 않습니다.')),
  password: z.string().min(4, '비밀번호는 4자 이상 입력하세요.'),
  role: roleSchema,
})
export type LoginFormValues = z.infer<typeof loginFormSchema>

/** 요청 주체를 목 서버에 알리는 헤더. 실제 서비스라면 세션 쿠키/토큰이 이 역할을 한다. */
export const DEMO_USER_HEADER = 'x-demo-user'
