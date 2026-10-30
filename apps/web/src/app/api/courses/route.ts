import { courseListQuerySchema } from '@lms/api-client'
import type { NextRequest } from 'next/server'
import { courseTable, enrollmentStore, filterCourses } from '@/lib/course-data'

/**
 * GET /api/courses?language=EN&level=INTERMEDIATE&q=회의
 * 외부 연동(예: 사내 포털 위젯)용 목 API. 페이지와 같은 필터 스키마·필터 함수를 쓴다.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const query = courseListQuerySchema.parse(Object.fromEntries(params))
  const items = filterCourses(courseTable, query).map((course) => ({
    slug: course.slug,
    title: course.title,
    language: course.language,
    level: course.level,
    format: course.format,
    startDate: course.startDate,
    price: course.price,
    remainingSeats: course.capacity - enrollmentStore.enrolled(course.slug),
  }))
  return Response.json({ items, total: items.length })
}
