import { z } from 'zod'

/**
 * 여러 폼이 공유하는 필드 규칙.
 * 어드민 수강생 등록, CSV 업로드, 학습자 사이트 수강 신청이 같은 규칙과 메시지를 쓴다.
 */

export const personNameField = z
  .string()
  .trim()
  .min(2, '이름은 2자 이상 입력하세요.')
  .max(20, '이름은 20자 이하로 입력하세요.')

export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('이메일 형식이 올바르지 않습니다.'))

const MOBILE_PATTERN = /^01[016789]\d{7,8}$/

/** 입력은 "010-1234-5678"도 허용하고, 저장 값은 숫자만 남긴다(입력 타입 ≠ 출력 타입). */
export const mobilePhoneField = z
  .string()
  .trim()
  .transform((value) => value.replace(/-/g, ''))
  .pipe(z.string().regex(MOBILE_PATTERN, '휴대폰 번호 형식이 올바르지 않습니다.'))
