import {
  ATTENDANCE_STATUS_LABEL,
  ATTENDANCE_STATUSES,
  LANGUAGE_LABEL,
  LESSON_STATUS_LABEL,
  LEVEL_LABEL,
  type AttendanceStatus,
  type LessonDetail,
  type RosterEntry,
} from '@lms/api-client'
import { useLesson, useUpdateAttendance } from '@lms/api-client/query'
import { Badge, Button, cn } from '@lms/ui'
import { formatDayLabel, toISODate } from '@lms/utils'
import { useOptimistic, useState, useTransition } from 'react'
import { Link, useParams } from 'react-router'
import { PageHeader } from '../../components/PageHeader'
import { ATTENDANCE_TONE, LESSON_STATUS_TONE } from './lessonDisplay'

export function LessonDetailPage() {
  const { lessonId = '' } = useParams()
  const lesson = useLesson(lessonId)

  if (lesson.isPending) {
    return <p className="py-12 text-center text-sm text-gray-500">불러오는 중…</p>
  }
  if (lesson.isError) {
    return (
      <div className="py-12 text-center">
        <p role="alert" className="text-danger-700 text-sm">
          {lesson.error.message}
        </p>
        <Link to="/lessons" className="text-brand-500 mt-4 inline-block text-[15px] font-semibold">
          수업 목록으로
        </Link>
      </div>
    )
  }
  return <LessonAttendance lesson={lesson.data} />
}

type AttendanceChange = { studentId: string; status: AttendanceStatus | null }

function LessonAttendance({ lesson }: { lesson: LessonDetail }) {
  const updateAttendance = useUpdateAttendance()
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [simulateFailure, setSimulateFailure] = useState(false)

  /**
   * React 19 useOptimistic: transition이 진행되는 동안만 낙관적 값을 보여준다.
   * - 성공: mutation onSuccess가 서버 응답으로 캐시(lesson.roster)를 갱신 → transition 종료 후에도 같은 값 유지
   * - 실패: 캐시는 그대로이므로 transition이 끝나는 순간 자동으로 이전 값으로 돌아간다(수동 롤백 코드 없음)
   */
  const [roster, applyOptimistic] = useOptimistic(
    lesson.roster,
    (current: RosterEntry[], changes: AttendanceChange[]) =>
      current.map((entry) => {
        const change = changes.find((c) => c.studentId === entry.student.id)
        return change ? { ...entry, status: change.status } : entry
      }),
  )

  const editable = lesson.status !== 'CANCELED' && lesson.date <= toISODate(new Date())
  const savedStatus = new Map(lesson.roster.map((e) => [e.student.id, e.status]))

  const save = (changes: AttendanceChange[]) => {
    if (changes.length === 0) return
    setErrorMessage(null)
    startTransition(async () => {
      applyOptimistic(changes)
      const results = await Promise.allSettled(
        changes.map((change) =>
          updateAttendance.mutateAsync({ lessonId: lesson.id, ...change, simulateFailure }),
        ),
      )
      const failed = results.filter((r) => r.status === 'rejected')
      if (failed.length > 0) {
        const reason = (failed[0] as PromiseRejectedResult).reason
        startTransition(() =>
          setErrorMessage(
            `${failed.length}건 저장에 실패해 이전 상태로 되돌렸습니다. (${reason instanceof Error ? reason.message : '알 수 없는 오류'})`,
          ),
        )
      }
    })
  }

  const unmarked = roster.filter((entry) => entry.status === null)
  const counts = ATTENDANCE_STATUSES.map(
    (status) => [status, roster.filter((e) => e.status === status).length] as const,
  )

  return (
    <>
      <PageHeader
        title={lesson.courseTitle}
        description={`${formatDayLabel(lesson.date)} ${lesson.startTime}–${lesson.endTime} · ${lesson.company} · ${lesson.teacherName} · ${LANGUAGE_LABEL[lesson.language]}`}
        actions={
          <Link
            to="/lessons"
            className="inline-flex h-11 items-center rounded-xl bg-white px-4 text-[15px] font-semibold text-gray-700 hover:bg-gray-50"
          >
            ← 수업 목록
          </Link>
        }
      />

      <section
        aria-label="출석 요약"
        className="rounded-card mb-4 flex flex-wrap items-center justify-between gap-4 bg-white px-6 py-5"
      >
        <div className="flex flex-wrap items-center gap-4 text-[15px]">
          <Badge tone={LESSON_STATUS_TONE[lesson.status]}>
            {LESSON_STATUS_LABEL[lesson.status]}
          </Badge>
          {counts.map(([status, count]) => (
            <span key={status} className="text-gray-600">
              {ATTENDANCE_STATUS_LABEL[status]} <strong className="text-gray-900">{count}</strong>
            </span>
          ))}
          <span className="text-gray-600">
            미체크 <strong className="text-gray-900">{unmarked.length}</strong>
          </span>
        </div>
        {editable && (
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-gray-500">
              <input
                type="checkbox"
                className="accent-danger-500 size-4"
                checked={simulateFailure}
                onChange={(event) => setSimulateFailure(event.target.checked)}
              />
              저장 실패 시뮬레이션(데모)
            </label>
            <Button
              size="sm"
              disabled={unmarked.length === 0}
              onClick={() =>
                save(unmarked.map((e) => ({ studentId: e.student.id, status: 'PRESENT' })))
              }
            >
              미체크 전원 출석
            </Button>
          </div>
        )}
      </section>

      {!editable && (
        <p className="mb-4 rounded-2xl bg-white px-6 py-4 text-[15px] text-gray-600">
          {lesson.status === 'CANCELED'
            ? '휴강한 수업은 출석을 체크할 수 없습니다.'
            : '아직 진행하지 않은 수업입니다. 수업 당일부터 출석을 체크할 수 있습니다.'}
        </p>
      )}

      <div aria-live="assertive" className="mb-4 empty:hidden">
        {errorMessage && (
          <p
            role="alert"
            className="bg-danger-50 text-danger-600 rounded-2xl px-5 py-4 text-[15px] font-medium"
          >
            {errorMessage}
          </p>
        )}
      </div>

      <ul
        aria-label="출석부"
        aria-busy={isPending || undefined}
        className="rounded-card overflow-hidden bg-white py-2"
      >
        {roster.map((entry) => {
          const saving = savedStatus.get(entry.student.id) !== entry.status
          return (
            <li
              key={entry.student.id}
              aria-label={entry.student.name}
              className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5"
            >
              <div className="text-[15px]">
                <span className="font-semibold text-gray-900">{entry.student.name}</span>
                <span className="ml-2 text-[13px] text-gray-500">
                  {entry.student.department} · {LEVEL_LABEL[entry.student.level]}
                </span>
                {saving && (
                  <span className="text-brand-500 ml-2 text-[13px] font-medium" aria-live="polite">
                    저장 중…
                  </span>
                )}
              </div>
              <div
                role="group"
                aria-label={`${entry.student.name} 출석 상태`}
                className="flex gap-1 rounded-xl bg-gray-100 p-1"
              >
                {ATTENDANCE_STATUSES.map((status) => {
                  const selected = entry.status === status
                  return (
                    <button
                      key={status}
                      type="button"
                      aria-pressed={selected}
                      disabled={!editable}
                      onClick={() =>
                        save([{ studentId: entry.student.id, status: selected ? null : status }])
                      }
                      className={cn(
                        'h-9 min-w-14 rounded-[10px] px-3 text-[14px] font-semibold transition-colors',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        selected
                          ? ATTENDANCE_TONE[status]
                          : 'text-gray-500 hover:bg-white/70 hover:text-gray-700',
                      )}
                    >
                      {ATTENDANCE_STATUS_LABEL[status]}
                    </button>
                  )
                })}
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}
