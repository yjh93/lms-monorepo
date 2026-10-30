import { COURSE_FORMAT_LABEL, LANGUAGE_LABEL, LEVEL_LABEL, type Course } from '@lms/api-client'
import { formatDate, formatKRW } from '@lms/utils'
import Link from 'next/link'

export function CourseCard({ course }: { course: Course }) {
  return (
    <li>
      <Link
        href={`/courses/${course.slug}`}
        className="group flex h-full flex-col rounded-3xl bg-gray-50 p-6 transition-colors hover:bg-gray-100"
      >
        <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
          <span className="bg-brand-50 text-brand-600 rounded-md px-2 py-1">
            {LANGUAGE_LABEL[course.language]}
          </span>
          <span className="rounded-md bg-white px-2 py-1 text-gray-600">
            {LEVEL_LABEL[course.level]}
          </span>
          <span className="rounded-md bg-white px-2 py-1 text-gray-600">
            {COURSE_FORMAT_LABEL[course.format]}
          </span>
        </div>
        <h3 className="group-hover:text-brand-600 mt-4 text-xl font-bold tracking-[-0.02em]">
          {course.title}
        </h3>
        <p className="mt-1.5 text-[15px] text-gray-600">{course.subtitle}</p>
        <dl className="mt-auto flex items-end justify-between pt-6 text-[14px]">
          <div>
            <dt className="sr-only">개강일</dt>
            <dd className="text-gray-500">{formatDate(course.startDate)} 개강</dd>
          </div>
          <div className="text-right">
            <dt className="sr-only">1인 수강료</dt>
            <dd className="text-[17px] font-bold text-gray-900">{formatKRW(course.price)}</dd>
          </div>
        </dl>
      </Link>
    </li>
  )
}

export function CourseGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul aria-hidden className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="h-56 animate-pulse rounded-3xl bg-gray-100" />
      ))}
    </ul>
  )
}
