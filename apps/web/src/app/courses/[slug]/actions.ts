'use server'

import { updateTag } from 'next/cache'
import { enrollmentStore, findCourse } from '@/lib/course-data'
import { seatsTag } from '@/lib/courses'
import { submitEnrollment, type EnrollmentState } from '@/lib/enrollment'

/**
 * 수강 신청 Server Action (useActionState용 시그니처: 이전 상태, FormData).
 * 성공하면 해당 강좌의 좌석 캐시를 updateTag로 즉시 만료시켜, 신청자가 갱신된 좌석 수를 바로 보게 한다.
 */
export async function enrollAction(
  _previous: EnrollmentState,
  formData: FormData,
): Promise<EnrollmentState> {
  const state = submitEnrollment(formData, {
    findCourse,
    enrolled: enrollmentStore.enrolled,
    add: enrollmentStore.add,
  })
  if (state.status === 'success') updateTag(seatsTag(String(formData.get('courseSlug'))))
  return state
}
