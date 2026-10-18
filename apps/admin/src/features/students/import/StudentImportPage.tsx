import { useImportStudents } from '@lms/api-client/query'
import { Badge, Button, cn, createDataTableColumnHelper, DataTable } from '@lms/ui'
import { formatNumber } from '@lms/utils'
import { useId, useMemo, useState, useTransition, type DragEvent } from 'react'
import { Link } from 'react-router'
import { PageHeader } from '../../../components/PageHeader'
import { downloadText } from '../../../lib/download'
import {
  buildErrorReport,
  buildTemplate,
  CSV_FIELDS,
  decodeCsv,
  MAX_ROWS,
  parseStudentCsv,
  type ImportRow,
} from './studentCsv'

type Parsed = { fileName: string; rows: ImportRow[] }

/** 업로드 후 서버 결과: 행 번호 → 등록됨 | 서버 검증 에러 */
type SubmitResult = Map<number, 'created' | Record<string, string>>

function ErrorList({ errors }: { errors: Record<string, string> }) {
  return (
    <ul className="text-danger-700 space-y-0.5 text-xs">
      {Object.entries(errors).map(([field, message]) => (
        <li key={field}>
          <span className="font-medium">{CSV_FIELDS.find((f) => f.field === field)?.label}</span>:{' '}
          {message}
        </li>
      ))}
    </ul>
  )
}

const column = createDataTableColumnHelper<ImportRow>()
const getColumns = (submitResult: SubmitResult | null) => [
  column.accessor('line', { header: '행', meta: { align: 'right', className: 'w-16' } }),
  column.accessor((row) => row.input.name, { id: 'name', header: '이름' }),
  column.accessor((row) => row.input.email, { id: 'email', header: '이메일' }),
  column.accessor((row) => row.input.company, { id: 'company', header: '고객사' }),
  column.display({
    id: 'result',
    header: '검증 결과',
    cell: ({ row: { original: row } }) => {
      if (!row.ok) return <ErrorList errors={row.errors} />
      const result = submitResult?.get(row.line)
      if (result === 'created') return <Badge tone="brand">등록됨</Badge>
      if (result) return <ErrorList errors={result} />
      return <Badge tone="success">정상</Badge>
    },
  }),
]

export function StudentImportPage() {
  const inputId = useId()
  const [parsed, setParsed] = useState<Parsed | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [errorsOnly, setErrorsOnly] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null)
  // 수백 행 검증·테이블 렌더링이 입력(드래그 하이라이트 등)을 막지 않도록 transition으로 처리
  const [isParsing, startParsing] = useTransition()
  const importStudents = useImportStudents()

  const handleFile = (file: File | undefined) => {
    if (!file) return
    startParsing(async () => {
      const text = decodeCsv(await file.arrayBuffer())
      const result = parseStudentCsv(text)
      setSubmitResult(null)
      setErrorsOnly(false)
      if (result.ok) {
        setParsed({ fileName: file.name, rows: result.rows })
        setFileError(null)
      } else {
        setParsed(null)
        setFileError(result.message)
      }
    })
  }

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setDragging(false)
    handleFile(event.dataTransfer.files[0])
  }

  const rows = parsed?.rows ?? []
  const validRows = rows.filter((row): row is Extract<ImportRow, { ok: true }> => row.ok)
  const errorCount = rows.length - validRows.length
  const hasError = (row: ImportRow) => !row.ok || typeof submitResult?.get(row.line) === 'object'
  const visibleRows = errorsOnly ? rows.filter(hasError) : rows
  const columns = useMemo(() => getColumns(submitResult), [submitResult])
  // 오류 리포트에는 서버에서 거절된 행도 포함
  const reportRows = rows.map((row): ImportRow => {
    const result = submitResult?.get(row.line)
    return typeof result === 'object'
      ? { line: row.line, input: row.input, ok: false, errors: result }
      : row
  })
  const reportErrorCount = reportRows.filter((row) => !row.ok).length
  const createdCount = submitResult
    ? [...submitResult.values()].filter((r) => r === 'created').length
    : null

  const submit = async () => {
    if (!parsed) return
    const result = await importStudents.mutateAsync(validRows.map((row) => row.values))
    // 서버 검증에서 실패한 행(예: 이미 등록된 이메일)은 원래 행 번호에 표시
    const failed = new Map(result.errors.map((e) => [validRows[e.index]!.line, e.fieldErrors]))
    setSubmitResult(new Map(validRows.map((row) => [row.line, failed.get(row.line) ?? 'created'])))
    setErrorsOnly(result.errors.length > 0)
  }

  return (
    <>
      <PageHeader
        title="수강생 CSV 일괄 등록"
        description={`최대 ${MAX_ROWS}행. 등록 폼과 같은 규칙으로 행마다 검증하고, 정상 행만 등록합니다.`}
        actions={
          <Button
            variant="surface"
            onClick={() => downloadText(buildTemplate(), '수강생_등록_양식.csv')}
          >
            양식 내려받기
          </Button>
        }
      />

      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'rounded-card mb-4 flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed bg-white px-6 py-14 text-center transition-colors',
          dragging
            ? 'border-brand-500 bg-brand-50'
            : 'hover:border-brand-300 border-gray-200 hover:bg-gray-50',
        )}
      >
        <span className="text-[17px] font-bold text-gray-900">
          {isParsing ? '검증하는 중…' : 'CSV 파일을 끌어다 놓거나 클릭해서 선택하세요'}
        </span>
        <span className="text-[13px] text-gray-500">
          필수 열:{' '}
          {CSV_FIELDS.filter((f) => f.required)
            .map((f) => f.label)
            .join(', ')}{' '}
          · UTF-8 / EUC-KR 모두 지원
        </span>
        <input
          id={inputId}
          type="file"
          accept=".csv,text/csv"
          aria-label="CSV 파일 선택"
          className="sr-only"
          onChange={(event) => {
            handleFile(event.target.files?.[0])
            event.target.value = ''
          }}
        />
      </label>

      {fileError && (
        <p
          role="alert"
          className="bg-danger-50 text-danger-600 mb-4 rounded-2xl px-5 py-4 text-[15px] font-medium"
        >
          {fileError}
        </p>
      )}

      {createdCount !== null && (
        <div
          role="status"
          className="bg-success-50 text-success-700 mb-4 rounded-2xl px-5 py-4 text-[15px] font-medium"
        >
          {formatNumber(createdCount)}명을 등록했습니다.{' '}
          <Link to="/students" className="font-medium underline">
            수강생 목록 보기
          </Link>
        </div>
      )}

      {parsed && (
        <>
          <section
            aria-label="검증 요약"
            className="rounded-card mb-4 flex flex-wrap items-center justify-between gap-4 bg-white p-6"
          >
            <dl className="flex gap-8">
              <div>
                <dt className="text-gray-500">파일</dt>
                <dd className="font-medium">{parsed.fileName}</dd>
              </div>
              <div>
                <dt className="text-gray-500">전체</dt>
                <dd className="font-medium">{formatNumber(rows.length)}행</dd>
              </div>
              <div>
                <dt className="text-gray-500">등록 가능</dt>
                <dd className="text-success-700 font-medium">{formatNumber(validRows.length)}행</dd>
              </div>
              <div>
                <dt className="text-gray-500">오류</dt>
                <dd className="text-danger-700 font-medium">{formatNumber(errorCount)}행</dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-2">
              <label className="flex cursor-pointer items-center gap-2 text-[14px] text-gray-700">
                <input
                  type="checkbox"
                  className="accent-brand-500 size-4"
                  checked={errorsOnly}
                  onChange={(event) => setErrorsOnly(event.target.checked)}
                />
                오류만 보기
              </label>
              {reportErrorCount > 0 && (
                <Button
                  variant="neutral"
                  onClick={() =>
                    downloadText(buildErrorReport(reportRows), `오류리포트_${parsed.fileName}`)
                  }
                >
                  오류 리포트 내려받기
                </Button>
              )}
              {createdCount === null && (
                <Button
                  onClick={submit}
                  loading={importStudents.isPending}
                  disabled={validRows.length === 0}
                >
                  정상 {formatNumber(validRows.length)}건 등록
                </Button>
              )}
            </div>
          </section>

          {importStudents.isError && (
            <p role="alert" className="text-danger-700 mb-4 text-sm">
              {importStudents.error.message}
            </p>
          )}

          <DataTable
            caption="CSV 검증 결과"
            data={visibleRows}
            columns={columns}
            getRowId={(row) => String(row.line)}
            emptyMessage="오류 행이 없습니다."
          />
        </>
      )}
    </>
  )
}
