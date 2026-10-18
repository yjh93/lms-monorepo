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
  const thisWeek = weekStartOf(new Date())

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
        className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4"
      >
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={!currentWeek}
            onClick={() => setParam('week', addDaysISO(currentWeek, -7))}
          >
            이전 주
          </Button>
          <p
            className="min-w-44 text-center text-sm font-semibold text-gray-900"
            aria-live="polite"
          >
            {currentWeek ? formatWeekRange(currentWeek) : '…'}
          </p>
          <Button
            variant="secondary"
            size="sm"
            disabled={!currentWeek}
            onClick={() => setParam('week', addDaysISO(currentWeek, 7))}
          >
            다음 주
          </Button>
          {currentWeek !== thisWeek && (
            <Button variant="ghost" size="sm" onClick={() => setParam('week', '')}>
              이번 주
            </Button>
          )}
        </div>
        {!isTeacher && (
          <Select
            aria-label="강사"
            className="h-9 w-48"
            placeholder="전체 강사"
            value={query.teacherId}
            onChange={(event) => setParam('teacherId', event.target.value)}
            options={(teachers.data ?? []).map((t) => ({ value: t.id, label: t.name }))}
          />
        )}
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
              <h2 className="mb-2 text-sm font-semibold text-gray-700">{formatDayLabel(date)}</h2>
              <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
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
        className="grid gap-2 px-4 py-3 text-sm hover:bg-gray-50 sm:grid-cols-[6rem_1fr_10rem_9rem] sm:items-center"
      >
        <span className="font-medium text-gray-900 tabular-nums">
          {lesson.startTime}–{lesson.endTime}
        </span>
        <span>
          <span className="font-medium text-gray-900">{lesson.courseTitle}</span>
          <span className="ml-2 text-xs text-gray-500">
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
            <span className="text-xs text-gray-500 tabular-nums">
              출석 {present + late}/{total}
              {unmarked > 0 && lesson.status === 'COMPLETED' && ` · 미체크 ${unmarked}`}
            </span>
          )}
        </span>
      </Link>
    </li>
  )
}
