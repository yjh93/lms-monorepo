import {
  COURSE_FORMAT_LABEL,
  COURSE_FORMATS,
  courseListQuerySchema,
  LANGUAGE_LABEL,
  LANGUAGES,
  LEVEL_LABEL,
  LEVELS,
  type CourseListQuery,
} from '@lms/api-client'
import { cn } from '@lms/ui'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { CourseCard, CourseGridSkeleton } from '@/components/CourseCard'
import { getCourses } from '@/lib/courses'

export const metadata: Metadata = {
  title: '강좌',
  description: '비즈니스 영어·일본어·중국어 기업 강좌를 언어, 레벨, 수업 방식별로 찾아보세요.',
  alternates: { canonical: '/courses' },
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>

/**
 * 정적 셸(제목·검색 폼)은 미리 렌더링하고, searchParams에 의존하는 결과는 Suspense 안에서 스트리밍한다.
 * 필터는 링크와 GET 폼으로 동작해 JS 없이도 쓸 수 있다.
 */
export default function CoursesPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="mx-auto max-w-6xl px-5 pt-14">
      <h1 className="text-[32px] font-bold tracking-[-0.03em]">강좌</h1>
      <p className="mt-2 text-[17px] text-gray-600">
        임직원 수준과 업무에 맞는 과정을 골라 보세요.
      </p>
      <Suspense fallback={<CourseGridSkeleton />}>
        <CourseResults searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

async function CourseResults({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams
  const query = courseListQuerySchema.parse({
    language: first(raw.language),
    level: first(raw.level),
    format: first(raw.format),
    q: first(raw.q),
  })
  const courses = await getCourses(query)

  return (
    <>
      <Filters query={query} />
      <p className="mt-8 mb-4 text-[15px] text-gray-500" aria-live="polite">
        {courses.length}개 강좌
      </p>
      {courses.length === 0 ? (
        <div className="rounded-3xl bg-gray-50 py-20 text-center">
          <p className="text-[17px] font-semibold">조건에 맞는 강좌가 없어요</p>
          <Link
            href="/courses"
            className="text-brand-500 mt-3 inline-block text-[15px] font-semibold"
          >
            필터 초기화
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.slug} course={course} />
          ))}
        </ul>
      )}
    </>
  )
}

function hrefWith(query: CourseListQuery, patch: Partial<CourseListQuery>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries({ ...query, ...patch }))
    if (value) params.set(key, value)
  const search = params.toString()
  return search ? `/courses?${search}` : '/courses'
}

function ChipRow<T extends string>({
  label,
  name,
  query,
  options,
}: {
  label: string
  name: 'language' | 'level' | 'format'
  query: CourseListQuery
  options: readonly { value: T; label: string }[]
}) {
  const current = query[name]
  const chip = (value: string, text: string) => (
    <Link
      key={value || 'all'}
      href={hrefWith(query, { [name]: value })}
      aria-current={current === value ? 'true' : undefined}
      scroll={false}
      className={cn(
        'inline-flex h-9 items-center rounded-full px-3.5 text-[14px] font-medium transition-colors',
        current === value
          ? 'bg-gray-800 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
      )}
    >
      {text}
    </Link>
  )
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-16 text-[13px] font-semibold text-gray-700">{label}</span>
      {chip('', '전체')}
      {options.map((option) => chip(option.value, option.label))}
    </div>
  )
}

function Filters({ query }: { query: CourseListQuery }) {
  return (
    <section aria-label="강좌 필터" className="mt-8 flex flex-col gap-3">
      <form action="/courses" className="mb-2 flex max-w-xl gap-2">
        {query.language && <input type="hidden" name="language" value={query.language} />}
        {query.level && <input type="hidden" name="level" value={query.level} />}
        {query.format && <input type="hidden" name="format" value={query.format} />}
        <label htmlFor="course-search" className="sr-only">
          강좌 검색
        </label>
        <input
          id="course-search"
          name="q"
          type="search"
          defaultValue={query.q}
          placeholder="강좌명, 키워드 (예: 회의, 시험)"
          className="focus:ring-brand-500 h-12 flex-1 rounded-xl bg-gray-100 px-4 text-[15px] placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:outline-none"
        />
        <button
          type="submit"
          className="bg-brand-500 hover:bg-brand-600 h-12 rounded-xl px-5 text-[15px] font-semibold text-white"
        >
          검색
        </button>
      </form>
      <ChipRow
        label="언어"
        name="language"
        query={query}
        options={LANGUAGES.map((value) => ({ value, label: LANGUAGE_LABEL[value] }))}
      />
      <ChipRow
        label="레벨"
        name="level"
        query={query}
        options={LEVELS.map((value) => ({ value, label: LEVEL_LABEL[value] }))}
      />
      <ChipRow
        label="수업 방식"
        name="format"
        query={query}
        options={COURSE_FORMATS.map((value) => ({ value, label: COURSE_FORMAT_LABEL[value] }))}
      />
    </section>
  )
}
