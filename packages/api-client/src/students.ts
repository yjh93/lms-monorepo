import { z } from 'zod'
import { request } from './http'
import {
  studentListResponseSchema,
  studentSchema,
  toStudentListSearchParams,
  type StudentFormValues,
  type StudentListQuery,
} from './schemas/student'

export function fetchStudents(query: StudentListQuery, signal?: AbortSignal) {
  return request('/students', {
    query: toStudentListSearchParams(query),
    schema: studentListResponseSchema,
    signal,
  })
}

export function fetchStudent(id: string, signal?: AbortSignal) {
  return request(`/students/${encodeURIComponent(id)}`, { schema: studentSchema, signal })
}

export function createStudent(values: StudentFormValues) {
  return request('/students', { method: 'POST', body: values, schema: studentSchema })
}

export function updateStudent(id: string, values: StudentFormValues) {
  return request(`/students/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: values,
    schema: studentSchema,
  })
}

export function fetchCompanies(signal?: AbortSignal) {
  return request('/companies', { schema: z.array(z.string()), signal })
}
