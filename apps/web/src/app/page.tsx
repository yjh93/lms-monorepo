import { CourseCard } from '@/components/CourseCard'
import { getCourses } from '@/lib/courses'
import Link from 'next/link'

const STEPS = [
  { title: '강좌 선택', body: '언어·레벨·수업 방식으로 맞는 과정을 고릅니다.' },
  { title: '기업 단위 신청', body: '담당자 정보와 인원을 남기면 바로 접수됩니다.' },
  { title: '레벨 테스트', body: '개강 전 수강생별 레벨을 확인해 반을 편성합니다.' },
  { title: '수업과 리포트', body: '출석·진도 리포트를 인사 담당자에게 정기 발송합니다.' },
]

/** 홈: 정적 셸 + 캐시된 추천 강좌 */
export default async function HomePage() {
  const featured = (await getCourses({ language: '', level: '', format: '', q: '' })).slice(0, 3)

  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pt-20 pb-16">
        <p className="text-brand-500 text-[15px] font-bold">기업 어학교육</p>
        <h1 className="mt-3 text-[40px] leading-[1.25] font-bold tracking-[-0.03em] sm:text-[52px]">
          임직원 어학교육,
          <br />
          신청부터 리포트까지 한 번에
        </h1>
        <p className="mt-5 max-w-xl text-[17px] text-gray-600">
          비즈니스 영어·일본어·중국어 과정을 실시간 온라인, 기업 방문, 혼합 방식으로 운영합니다.
        </p>
        <div className="mt-8 flex gap-2">
          <Link
            href="/courses"
            className="bg-brand-500 hover:bg-brand-600 inline-flex h-14 items-center rounded-2xl px-6 text-[17px] font-semibold text-white"
          >
            강좌 둘러보기
          </Link>
          <Link
            href="/courses?format=ONSITE"
            className="inline-flex h-14 items-center rounded-2xl bg-gray-100 px-6 text-[17px] font-semibold text-gray-700 hover:bg-gray-200"
          >
            방문 수업 보기
          </Link>
        </div>
      </section>

      <section aria-labelledby="featured" className="mx-auto max-w-6xl px-5">
        <div className="mb-6 flex items-end justify-between">
          <h2 id="featured" className="text-2xl font-bold tracking-[-0.02em]">
            지금 모집 중인 강좌
          </h2>
          <Link href="/courses" className="text-brand-500 text-[15px] font-semibold">
            전체 보기
          </Link>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((course) => (
            <CourseCard key={course.slug} course={course} />
          ))}
        </ul>
      </section>

      <section aria-labelledby="steps" className="mx-auto mt-24 max-w-6xl px-5">
        <h2 id="steps" className="text-2xl font-bold tracking-[-0.02em]">
          진행 방식
        </h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-3xl bg-gray-50 p-6">
              <span className="text-brand-500 text-[15px] font-bold">{index + 1}</span>
              <h3 className="mt-2 text-[17px] font-bold">{step.title}</h3>
              <p className="mt-1.5 text-[15px] text-gray-600">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}
