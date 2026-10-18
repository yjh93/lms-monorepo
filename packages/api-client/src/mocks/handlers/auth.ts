import { delay, http, HttpResponse } from 'msw'
import { loginFormSchema } from '../../schemas/auth'
import { DEMO_USERS } from '../db'
import { api, errorResponse, toFieldErrors } from '../http-utils'

export const authHandlers = [
  http.post(api('/auth/login'), async ({ request }) => {
    await delay()
    const parsed = loginFormSchema.safeParse(await request.json())
    if (!parsed.success) {
      return errorResponse(422, {
        message: '입력값을 확인하세요.',
        fieldErrors: toFieldErrors(parsed.error.issues),
      })
    }
    const user = DEMO_USERS.find((u) => u.role === parsed.data.role)!
    return HttpResponse.json(user)
  }),
]
