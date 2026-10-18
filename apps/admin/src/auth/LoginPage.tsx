import { zodResolver } from '@hookform/resolvers/zod'
import { login, loginFormSchema, type LoginFormValues } from '@lms/api-client'
import { Button, cn, Input } from '@lms/ui'
import { ROLE_LABEL, ROLES, type Role } from '@lms/utils'
import { useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { Navigate, useLocation, type Location } from 'react-router'
import { authStore, useAuthUser } from './authStore'
import { homePathFor } from './home'

const ROLE_DESCRIPTION: Record<Role, string> = {
  ADMIN: '모든 기능 + 감사 로그 조회',
  MANAGER: '수강생 등록·수정·CSV 업로드, 수업/출석, 대시보드',
  TEACHER: '본인 수업 출석 체크, 수강생 조회만 가능',
}

export function LoginPage() {
  const user = useAuthUser()
  const location = useLocation()
  const queryClient = useQueryClient()
  const from = (location.state as { from?: Location } | null)?.from

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: 'demo@lms.dev', password: 'demo1234', role: 'ADMIN' },
  })
  // watch()는 React Compiler가 메모이제이션할 수 없어 컴포넌트 최적화가 꺼진다 → useWatch로 구독
  const selectedRole = useWatch({ control, name: 'role' })

  // 로그인 직후(또는 이미 로그인 상태) 원래 가려던 경로, 없으면 역할별 첫 화면으로 보낸다.
  if (user) {
    const target = from ? `${from.pathname}${from.search}` : homePathFor(user.role)
    return <Navigate to={target} replace />
  }

  const submit = handleSubmit(async (values) => {
    try {
      const nextUser = await login(values)
      // 다른 사용자의 캐시가 남지 않도록 로그인 시점에 비운다.
      queryClient.clear()
      authStore.setUser(nextUser)
    } catch (error) {
      setError('root', {
        message: error instanceof Error ? error.message : '로그인에 실패했습니다.',
      })
    }
  })

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <form
        noValidate
        onSubmit={submit}
        aria-label="로그인"
        className="flex w-full max-w-md flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
      >
        <div>
          <h1 className="text-xl font-bold text-gray-900">LMS 운영 어드민</h1>
          <p className="mt-1 text-sm text-gray-500">
            데모용 목 로그인입니다. 역할을 골라 권한별 화면을 확인하세요.
          </p>
        </div>

        <Input label="이메일" type="email" {...register('email')} error={errors.email?.message} />
        <Input
          label="비밀번호"
          type="password"
          {...register('password')}
          error={errors.password?.message}
        />

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-gray-800">역할</legend>
          {ROLES.map((role) => (
            <label
              key={role}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm',
                selectedRole === role ? 'border-brand-500 bg-brand-50' : 'border-gray-200',
              )}
            >
              <input
                type="radio"
                value={role}
                className="accent-brand-600 mt-0.5"
                {...register('role')}
              />
              <span>
                <span className="font-medium text-gray-900">{ROLE_LABEL[role]}</span>
                <span className="mt-0.5 block text-xs text-gray-500">{ROLE_DESCRIPTION[role]}</span>
              </span>
            </label>
          ))}
        </fieldset>

        {errors.root && (
          <p role="alert" className="text-danger-600 text-sm">
            {errors.root.message}
          </p>
        )}

        <Button type="submit" size="lg" loading={isSubmitting}>
          로그인
        </Button>
      </form>
    </main>
  )
}
