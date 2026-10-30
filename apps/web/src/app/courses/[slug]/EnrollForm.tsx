'use client'

import type { EnrollmentField } from '@lms/api-client'
import { Button, Input } from '@lms/ui'
import { useActionState } from 'react'
import { initialEnrollmentState } from '@/lib/enrollment'
import { enrollAction } from './actions'

/**
 * 수강 신청 폼: Server Action + useActionState.
 * - 검증은 서버가 공유 zod 스키마로 수행하고, 필드 에러와 입력값을 돌려준다.
 * - <form action>이라 JS가 로드되기 전에도 제출된다(점진적 향상).
 */
export function EnrollForm({ courseSlug, remaining }: { courseSlug: string; remaining: number }) {
  const [state, formAction, pending] = useActionState(enrollAction, initialEnrollmentState)

  if (state.status === 'success') {
    return (
      <div role="status" className="bg-success-50 rounded-3xl p-6">
        <p className="text-success-700 text-[17px] font-bold">신청이 접수되었어요</p>
        <p className="mt-2 text-[15px] text-gray-700">
          접수 번호 <strong className="tabular-nums">{state.reference}</strong> · {state.headcount}
          명
        </p>
        <p className="mt-1 text-[15px] text-gray-600">
          {state.email}로 레벨 테스트 안내를 보내드립니다. 남은 자리 {state.remaining}석
        </p>
      </div>
    )
  }

  const errors = state.status === 'error' ? state.fieldErrors : {}
  const values = state.status === 'error' ? state.values : {}
  const value = (field: EnrollmentField) => values[field] ?? ''
  // 실패 응답마다 key를 바꿔 defaultValue(서버가 돌려준 입력값)가 다시 적용되게 한다.
  const formKey = state.status === 'error' ? JSON.stringify(values) : 'initial'

  if (remaining === 0) {
    return (
      <p className="rounded-3xl bg-gray-50 p-6 text-[15px] font-semibold text-gray-600">
        모집이 마감되었습니다. 다음 기수 개설 시 안내해 드릴게요.
      </p>
    )
  }

  return (
    <form
      key={formKey}
      action={formAction}
      noValidate
      aria-label="수강 신청"
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="courseSlug" value={courseSlug} />
      <Input
        label="담당자 이름"
        name="name"
        required
        defaultValue={value('name')}
        error={errors.name}
      />
      <Input
        label="회사 이메일"
        name="email"
        type="email"
        required
        defaultValue={value('email')}
        error={errors.email}
      />
      <Input
        label="휴대폰 번호"
        name="phone"
        type="tel"
        required
        placeholder="010-1234-5678"
        defaultValue={value('phone')}
        error={errors.phone}
      />
      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <Input
          label="회사명"
          name="company"
          required
          defaultValue={value('company')}
          error={errors.company}
        />
        <Input
          label="인원"
          name="headcount"
          type="number"
          min={1}
          max={remaining}
          required
          defaultValue={value('headcount') || '1'}
          error={errors.headcount}
        />
      </div>
      <Input
        label="문의 사항"
        name="message"
        defaultValue={value('message')}
        error={errors.message}
      />
      <label className="flex items-start gap-2 text-[14px] text-gray-700">
        <input
          type="checkbox"
          name="agree"
          className="accent-brand-500 mt-0.5 size-4"
          aria-invalid={errors.agree ? true : undefined}
          aria-describedby={errors.agree ? 'agree-error' : undefined}
        />
        <span>
          개인정보 수집·이용에 동의합니다. <span className="text-gray-500">(필수)</span>
        </span>
      </label>
      {errors.agree && (
        <p id="agree-error" role="alert" className="text-danger-500 -mt-2 text-[13px]">
          {errors.agree}
        </p>
      )}
      {state.status === 'error' && Object.keys(errors).length === 0 && (
        <p role="alert" className="text-danger-500 text-[14px]">
          {state.message}
        </p>
      )}
      <Button type="submit" size="lg" loading={pending} className="mt-2 w-full">
        수강 신청하기
      </Button>
    </form>
  )
}
