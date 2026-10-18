import { z } from 'zod'
import { request } from './http'
import {
  studentImportResultSchema,
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

/** CSV 일괄 등록. 서버도 행 단위로 재검증하고, 실패한 행은 errors로 돌려준다(부분 성공). */
export function importStudents(rows: StudentFormValues[]) {
  return request('/students/import', {
    method: 'POST',
    body: { rows },
    schema: studentImportResultSchema,
  })
}

export function fetchCompanies(signal?: AbortSignal) {
  return request('/companies', { schema: z.array(z.string()), signal })
}
