import { COURSE_FORMAT_LABEL, LANGUAGE_LABEL, LEVEL_LABEL, type Course } from '@lms/api-client'
import { formatDate, formatKRW } from '@lms/utils'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { getCourse, getCourseSlugs, getSeatStatus } from '@/lib/courses'
import { SITE_NAME, SITE_URL } from '@/lib/site'
import { EnrollForm } from './EnrollForm'

type Params = Promise<{ slug: string }>

/** 알려진 강좌는 빌드 시 미리 렌더링한다. */
export async function generateStaticParams() {
  return (await getCourseSlugs()).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const course = await getCourse(slug)
  if (!course) return { title: '강좌를 찾을 수 없습니다' }
  const description = `${course.subtitle} · ${LANGUAGE_LABEL[course.language]} ${LEVEL_LABEL[course.level]} · ${course.weeks}주 과정`
  return {
    title: course.title,
    description,
    alternates: { canonical: `/courses/${course.slug}` },
    openGraph: {
      title: course.title,
      description,
      url: `/courses/${course.slug}`,
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: course.title, description },
  }
}

export default async function CoursePage({ params }: { params: Params }) {
  const { slug } = await params
  const course = await getCourse(slug)
  if (!course) notFound()

  return (
    <article className="mx-auto max-w-6xl px-5 pt-10">
      <CourseJsonLd course={course} />
      <nav aria-label="경로" className="text-[14px] text-gray-500">
        <Link href="/courses" className="hover:text-gray-700">
          강좌
        </Link>
        <span aria-hidden> / </span>
        <span>{LANGUAGE_LABEL[course.language]}</span>
      </nav>

      <div className="mt-6 grid gap-12 lg:grid-cols-[1fr_24rem]">
        <div>
          <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
            <span className="bg-brand-50 text-brand-600 rounded-md px-2 py-1">
              {LANGUAGE_LABEL[course.language]}
            </span>
            <span className="rounded-md bg-gray-100 px-2 py-1 text-gray-600">
              {LEVEL_LABEL[course.level]}
            </span>
            <span className="rounded-md bg-gray-100 px-2 py-1 text-gray-600">
              {COURSE_FORMAT_LABEL[course.format]}
            </span>
          </div>
          <h1 className="mt-4 text-[36px] leading-tight font-bold tracking-[-0.03em]">
            {course.title}
          </h1>
          <p className="mt-3 text-[19px] text-gray-600">{course.subtitle}</p>

          <dl className="mt-8 grid grid-cols-2 gap-4 rounded-3xl bg-gray-50 p-6 sm:grid-cols-4">
            {[
              ['개강', formatDate(course.startDate)],
              ['기간', `${course.weeks}주`],
              ['수업', `주 ${course.sessionsPerWeek}회 · ${course.minutesPerSession}분`],
              ['1인 수강료', formatKRW(course.price)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-[13px] text-gray-500">{label}</dt>
                <dd className="mt-1 text-[17px] font-bold">{value}</dd>
              </div>
            ))}
          </dl>

          <section className="mt-12" aria-labelledby="about">
            <h2 id="about" className="text-xl font-bold">
              과정 소개
            </h2>
            <p className="mt-3 text-[16px] leading-relaxed text-gray-700">{course.summary}</p>
            <ul className="mt-5 flex flex-col gap-2">
              {course.outcomes.map((outcome) => (
                <li key={outcome} className="flex gap-2 text-[16px] text-gray-800">
                  <span aria-hidden className="text-brand-500 font-bold">
                    ✓
                  </span>
                  {outcome}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-12" aria-labelledby="curriculum">
            <h2 id="curriculum" className="text-xl font-bold">
              커리큘럼
            </h2>
            <ol className="mt-4 flex flex-col gap-2">
              {course.curriculum.map((item) => (
                <li key={item.week} className="rounded-2xl bg-gray-50 px-5 py-4">
                  <p className="text-[13px] font-semibold text-gray-500">{item.week}주차</p>
                  <p className="mt-0.5 text-[16px] font-semibold">{item.title}</p>
                  <p className="mt-1 text-[14px] text-gray-600">{item.topics.join(' · ')}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-12" aria-labelledby="teacher">
            <h2 id="teacher" className="text-xl font-bold">
              강사
            </h2>
            <div className="mt-4 rounded-3xl bg-gray-50 p-6">
              <p className="text-[17px] font-bold">{course.teacher.name}</p>
              <p className="text-[14px] text-gray-500">{course.teacher.title}</p>
              <p className="mt-3 text-[15px] text-gray-700">{course.teacher.bio}</p>
            </div>
          </section>
        </div>

        <aside aria-labelledby="enroll" className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-gray-100 p-6 shadow-[0_8px_24px_rgb(0_23_51/0.06)]">
            <h2 id="enroll" className="text-xl font-bold">
              기업 수강 신청
            </h2>
            {/* 좌석은 신청에 따라 바뀌는 데이터: 별도 캐시(짧은 수명 + 태그)로 두고 스트리밍한다. */}
            <Suspense fallback={<div className="mt-4 h-96 animate-pulse rounded-2xl bg-gray-50" />}>
              <SeatsAndForm slug={course.slug} />
            </Suspense>
          </div>
        </aside>
      </div>
    </article>
  )
}

async function SeatsAndForm({ slug }: { slug: string }) {
  const seats = await getSeatStatus(slug)
  if (!seats) return null
  const ratio = seats.enrolled / seats.capacity
  return (
    <>
      <div className="mt-4">
        <div className="flex items-baseline justify-between text-[14px]">
          <span className="text-gray-600">남은 자리</span>
          <span>
            <strong className={ratio >= 0.8 ? 'text-danger-500 text-[17px]' : 'text-[17px]'}>
              {seats.remaining}석
            </strong>
            <span className="text-gray-500"> / {seats.capacity}석</span>
          </span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-gray-100" aria-hidden>
          <div
            className={
              ratio >= 0.8 ? 'bg-danger-500 h-2 rounded-full' : 'bg-brand-500 h-2 rounded-full'
            }
            style={{ width: `${Math.min(100, ratio * 100)}%` }}
          />
        </div>
        {ratio >= 0.8 && seats.remaining > 0 && (
          <p className="text-danger-500 mt-2 text-[13px] font-semibold">마감 임박</p>
        )}
      </div>
      <div className="mt-6">
        <EnrollForm courseSlug={slug} remaining={seats.remaining} />
      </div>
    </>
  )
}

/** 검색엔진용 구조화 데이터(schema.org Course) */
function CourseJsonLd({ course }: { course: Course }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.summary,
    url: `${SITE_URL}/courses/${course.slug}`,
    inLanguage: 'ko',
    provider: { '@type': 'Organization', name: SITE_NAME, sameAs: SITE_URL },
    offers: {
      '@type': 'Offer',
      category: 'Paid',
      price: course.price,
      priceCurrency: 'KRW',
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode:
        course.format === 'ONSITE' ? 'Onsite' : course.format === 'ONLINE' ? 'Online' : 'Blended',
      startDate: course.startDate,
      instructor: { '@type': 'Person', name: course.teacher.name },
    },
  }
  return (
    <script
      type="application/ld+json"
      // JSON-LD 안에서 </script>가 끊기지 않도록 '<'를 이스케이프한다.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
