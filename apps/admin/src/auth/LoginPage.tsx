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
    <main className="flex min-h-screen items-center justify-center bg-white px-5 py-12">
      <form
        noValidate
        onSubmit={submit}
        aria-label="로그인"
        className="flex w-full max-w-[400px] flex-col"
      >
        <span
          aria-hidden
          className="bg-brand-500 mb-6 flex size-11 items-center justify-center rounded-xl text-lg font-bold text-white"
        >
          L
        </span>
        <h1 className="text-[28px] leading-[1.35] font-bold tracking-[-0.02em] text-gray-900">
          역할을 고르고
          <br />
          운영 어드민에 로그인하세요
        </h1>
        <p className="mt-2 text-[15px] text-gray-600">
          데모용 목 로그인이에요. 역할마다 보이는 메뉴와 버튼이 달라요.
        </p>

        <div className="mt-8 flex flex-col gap-4">
          <Input label="이메일" type="email" {...register('email')} error={errors.email?.message} />
          <Input
            label="비밀번호"
            type="password"
            {...register('password')}
            error={errors.password?.message}
          />
        </div>

        <fieldset className="mt-6 flex flex-col gap-2">
          <legend className="mb-2 text-[13px] font-semibold text-gray-700">역할</legend>
          {ROLES.map((role) => (
            <label
              key={role}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-2xl p-4 transition-colors',
                'has-[:focus-visible]:ring-brand-500 has-[:focus-visible]:ring-2',
                selectedRole === role ? 'bg-brand-50' : 'bg-gray-50 hover:bg-gray-100',
              )}
            >
              <input type="radio" value={role} className="peer sr-only" {...register('role')} />
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    'block text-[16px] font-semibold',
                    selectedRole === role ? 'text-brand-600' : 'text-gray-900',
                  )}
                >
                  {ROLE_LABEL[role]}
                </span>
                <span className="mt-0.5 block text-[13px] text-gray-500">
                  {ROLE_DESCRIPTION[role]}
                </span>
              </span>
              <span
                aria-hidden
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full transition-colors',
                  selectedRole === role
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-200 text-transparent',
                )}
              >
                <svg viewBox="0 0 16 16" className="size-3.5">
                  <path
                    d="m4 8.5 2.5 2.5L12 5.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </label>
          ))}
        </fieldset>

        {errors.root && (
          <p role="alert" className="text-danger-500 mt-4 text-[14px]">
            {errors.root.message}
          </p>
        )}

        <Button type="submit" size="lg" className="mt-8 w-full" loading={isSubmitting}>
          로그인
        </Button>
      </form>
    </main>
  )
}
