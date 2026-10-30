import type { CourseListQuery } from '@lms/api-client'
import { cacheLife, cacheTag } from 'next/cache'
import { courseTable, enrollmentStore, filterCourses, findCourse } from './course-data'

/**
 * 강좌 데이터 조회. 'use cache'로 결과를 캐시하고 태그로 무효화한다.
 * - 강좌 정보: 자주 바뀌지 않으므로 hours
 * - 남은 좌석: 수명이 짧은 캐시(seconds)라 정적 셸에서 빠지고 요청 시 스트리밍된다.
 *   신청 시 updateTag로 즉시 만료시켜 신청자가 바로 갱신된 값을 본다(read-your-own-writes).
 */
export async function getCourses(query: CourseListQuery) {
  'use cache'
  cacheLife('hours')
  cacheTag('courses')
  return filterCourses(courseTable, query)
}

export async function getCourse(slug: string) {
  'use cache'
  cacheLife('hours')
  cacheTag('courses', `course:${slug}`)
  return findCourse(slug)
}

export async function getCourseSlugs() {
  'use cache'
  cacheLife('days')
  cacheTag('courses')
  return courseTable.map((course) => course.slug)
}

export const seatsTag = (slug: string) => `seats:${slug}`

export async function getSeatStatus(slug: string) {
  'use cache'
  cacheLife('seconds')
  cacheTag(seatsTag(slug))
  const course = findCourse(slug)
  if (!course) return null
  const enrolled = enrollmentStore.enrolled(slug)
  return { capacity: course.capacity, enrolled, remaining: Math.max(0, course.capacity - enrolled) }
}
