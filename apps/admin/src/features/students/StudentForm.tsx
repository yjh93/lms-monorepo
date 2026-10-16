import { zodResolver } from '@hookform/resolvers/zod'
import {
  isApiError,
  studentFormSchema,
  type StudentFormInput,
  type StudentFormValues,
} from '@lms/api-client'
import { Button, Input, Select } from '@lms/ui'
import { useForm } from 'react-hook-form'
import { levelOptions, statusOptions } from './studentDisplay'

interface StudentFormProps {
  defaultValues: StudentFormInput
  submitLabel: string
  onSubmit: (values: StudentFormValues) => Promise<unknown>
  onCancel: () => void
}

/**
 * 등록/수정 공용 폼.
 * - 검증 규칙은 api-client의 studentFormSchema 하나(클라이언트 = MSW 서버).
 * - useForm<입력 타입, context, 출력 타입>: 전화번호처럼 transform 되는 필드의 타입을 정확히 구분한다.
 * - 서버가 돌려준 fieldErrors(예: 이메일 중복)는 해당 필드 에러로 매핑한다.
 */
export function StudentForm({ defaultValues, submitLabel, onSubmit, onCancel }: StudentFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<StudentFormInput, unknown, StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues,
    mode: 'onTouched',
  })

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values)
    } catch (error) {
      if (isApiError(error) && Object.keys(error.fieldErrors).length > 0) {
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          setError(
            field as keyof StudentFormInput,
            { type: 'server', message },
            { shouldFocus: true },
          )
        }
        return
      }
      setError('root.server', {
        type: 'server',
        message: error instanceof Error ? error.message : '저장에 실패했습니다.',
      })
    }
  })

  return (
    <form
      noValidate
      onSubmit={submit}
      aria-label="수강생 정보"
      className="grid max-w-3xl gap-5 rounded-xl border border-gray-200 bg-white p-6 sm:grid-cols-2"
    >
      <Input
        label="이름"
        required
        autoComplete="off"
        {...register('name')}
        error={errors.name?.message}
      />
      <Input
        label="이메일"
        type="email"
        required
        {...register('email')}
        error={errors.email?.message}
      />
      <Input
        label="휴대폰 번호"
        type="tel"
        required
        placeholder="010-1234-5678"
        hint="하이픈(-)은 있어도 없어도 됩니다."
        {...register('phone')}
        error={errors.phone?.message}
      />
      <Input
        label="수강 시작일"
        type="date"
        required
        {...register('enrolledAt')}
        error={errors.enrolledAt?.message}
      />
      <Input label="고객사" required {...register('company')} error={errors.company?.message} />
      <Input label="부서" {...register('department')} error={errors.department?.message} />
      <Select
        label="레벨"
        required
        options={levelOptions}
        {...register('level')}
        error={errors.level?.message}
      />
      <Select
        label="수강 상태"
        required
        options={statusOptions}
        {...register('status')}
        error={errors.status?.message}
      />
      <Input
        label="메모"
        className="sm:col-span-2"
        {...register('memo')}
        error={errors.memo?.message}
      />

      {errors.root?.server && (
        <p role="alert" className="text-danger-600 text-sm sm:col-span-2">
          {errors.root.server.message}
        </p>
      )}

      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button variant="secondary" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
