import {
  LANGUAGE_LABEL,
  LESSON_STATUS_LABEL,
  lessonListQuerySchema,
  type Lesson,
} from '@lms/api-client'
import { useLessons, useTeachers } from '@lms/api-client/query'
import { Badge, Button, Select } from '@lms/ui'
import { addDaysISO, formatDayLabel, formatWeekRange, weekStartOf } from '@lms/utils'
import { Link, useSearchParams } from 'react-router'
import { useAuthUser } from '../../auth/authStore'
import { PageHeader } from '../../components/PageHeader'
import { LESSON_STATUS_TONE } from './lessonDisplay'

function WeekArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: 'prev' | 'next'
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={direction === 'prev' ? '이전 주' : '다음 주'}
      disabled={disabled}
      onClick={onClick}
      className="flex size-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-800 disabled:opacity-40"
    >
      <svg viewBox="0 0 20 20" aria-hidden className="size-4">
        <path
          d={direction === 'prev' ? 'M12.5 5l-5 5 5 5' : 'M7.5 5l5 5-5 5'}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

function groupByDate(lessons: Lesson[]) {
  const groups = new Map<string, Lesson[]>()
  for (const lesson of lessons)
    groups.set(lesson.date, [...(groups.get(lesson.date) ?? []), lesson])
  return [...groups.entries()]
}

export function LessonListPage() {
  const user = useAuthUser()
  const isTeacher = user?.role === 'TEACHER'
  const [searchParams, setSearchParams] = useSearchParams()
  const query = lessonListQuerySchema.parse(Object.fromEntries(searchParams))
  const lessons = useLessons(query)
  const teachers = useTeachers({ enabled: !isTeacher })

  const currentWeek = lessons.data?.week ?? (query.week ? weekStartOf(query.week) : '')
  const isThisWeek = currentWeek === weekStartOf(new Date())

  const setParam = (key: 'week' | 'teacherId', value: string) =>
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous)
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    })

  return (
    <>
      <PageHeader
        title={isTeacher ? '내 수업' : '수업/출석'}
        description="주 단위로 수업을 확인하고 출석을 체크합니다."
      />

      <section
        aria-label="주 선택"
        className="rounded-card mb-6 flex flex-wrap items-center justify-between gap-3 bg-white px-6 py-4"
      >
        {/* 이전/다음 화살표가 기간을 감싸는 하나의 컨트롤. 이번 주 여부는 배지로 표시해 위치가 흔들리지 않는다. */}
        <div className="flex items-center gap-3">
          <WeekArrow
            direction="prev"
            disabled={!currentWeek}
            onClick={() => setParam('week', addDaysISO(currentWeek, -7))}
          />
          <p
            className="flex min-w-56 items-center justify-center gap-2 text-[17px] font-bold text-gray-900 tabular-nums"
            aria-live="polite"
          >
            {currentWeek ? formatWeekRange(currentWeek) : '…'}
            {isThisWeek && <Badge tone="brand">이번 주</Badge>}
          </p>
          <WeekArrow
            direction="next"
            disabled={!currentWeek}
            onClick={() => setParam('week', addDaysISO(currentWeek, 7))}
          />
        </div>
        <div className="flex items-center gap-2">
          {!isThisWeek && currentWeek && (
            <Button variant="neutral" size="sm" onClick={() => setParam('week', '')}>
              이번 주로
            </Button>
          )}
          {!isTeacher && (
            <Select
              aria-label="강사"
              className="h-9 w-44 rounded-[10px] text-[14px]"
              placeholder="전체 강사"
              value={query.teacherId}
              onChange={(event) => setParam('teacherId', event.target.value)}
              options={(teachers.data ?? []).map((t) => ({ value: t.id, label: t.name }))}
            />
          )}
        </div>
      </section>

      {lessons.isPending ? (
        <p className="py-12 text-center text-sm text-gray-500">불러오는 중…</p>
      ) : lessons.isError ? (
        <p role="alert" className="text-danger-700 py-12 text-center text-sm">
          {lessons.error.message}
        </p>
      ) : lessons.data.items.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-500">이번 주에는 수업이 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {groupByDate(lessons.data.items).map(([date, items]) => (
            <section key={date} aria-label={formatDayLabel(date)}>
              <h2 className="mb-3 px-1 text-[15px] font-bold text-gray-800">
                {formatDayLabel(date)}
              </h2>
              <ul className="rounded-card overflow-hidden bg-white py-2">
                {items.map((lesson) => (
                  <LessonRow key={lesson.id} lesson={lesson} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  )
}

function LessonRow({ lesson }: { lesson: Lesson }) {
  const { present, late, absent, excused, unmarked } = lesson.attendance
  const total = present + late + absent + excused + unmarked
  return (
    <li>
      <Link
        to={`/lessons/${lesson.id}`}
        className="grid gap-2 px-6 py-4 text-[15px] transition-colors hover:bg-gray-50 sm:grid-cols-[7rem_1fr_9rem_11rem] sm:items-center"
      >
        <span className="font-semibold text-gray-900 tabular-nums">
          {lesson.startTime}–{lesson.endTime}
        </span>
        <span>
          <span className="font-semibold text-gray-900">{lesson.courseTitle}</span>
          <span className="mt-0.5 block text-[13px] text-gray-500">
            {lesson.company} · {LANGUAGE_LABEL[lesson.language]} ·{' '}
            {lesson.mode === 'ONLINE' ? '온라인' : '방문'}
          </span>
        </span>
        <span className="text-gray-600">{lesson.teacherName}</span>
        <span className="flex items-center gap-2 sm:justify-end">
          <Badge tone={LESSON_STATUS_TONE[lesson.status]}>
            {LESSON_STATUS_LABEL[lesson.status]}
          </Badge>
          {lesson.status !== 'CANCELED' && (
            <span className="text-[13px] text-gray-500 tabular-nums">
              출석 {present + late}/{total}
              {unmarked > 0 && lesson.status === 'COMPLETED' && ` · 미체크 ${unmarked}`}
            </span>
          )}
        </span>
      </Link>
    </li>
  )
}
