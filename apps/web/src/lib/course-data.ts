import type { Course, CourseListQuery } from '@lms/api-client'
import { createCourseFixtures } from '@lms/api-client/fixtures'

/** 서버 프로세스 메모리의 강좌 "DB" (백엔드 없이 동작하는 데모 데이터 소스) */
export const courseTable: readonly Course[] = createCourseFixtures()

export function findCourse(slug: string) {
  return courseTable.find((course) => course.slug === slug) ?? null
}

/** 목록 필터(순수 함수): Route Handler와 페이지가 같은 규칙을 쓴다. */
export function filterCourses(courses: readonly Course[], query: CourseListQuery) {
  const keyword = query.q.toLowerCase()
  return courses.filter(
    (course) =>
      (!query.language || course.language === query.language) &&
      (!query.level || course.level === query.level) &&
      (!query.format || course.format === query.format) &&
      (!keyword ||
        [course.title, course.subtitle, course.summary, ...course.tags]
          .join(' ')
          .toLowerCase()
          .includes(keyword)),
  )
}

/** 신청 인원 저장소. 시드 값은 강좌마다 다르게 채워 "마감 임박" 상태도 보이게 한다. */
const enrolled = new Map<string, number>(
  courseTable.map((course, index) => [
    course.slug,
    Math.max(0, course.capacity - 2 - (index % 4) * 3),
  ]),
)

export const enrollmentStore = {
  enrolled: (slug: string) => enrolled.get(slug) ?? 0,
  add(slug: string, headcount: number) {
    enrolled.set(slug, (enrolled.get(slug) ?? 0) + headcount)
  },
}
