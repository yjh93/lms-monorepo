import { request } from './http'
import { authUserSchema, type LoginFormValues } from './schemas/auth'

export function login(values: LoginFormValues) {
  return request('/auth/login', { method: 'POST', body: values, schema: authUserSchema })
}
