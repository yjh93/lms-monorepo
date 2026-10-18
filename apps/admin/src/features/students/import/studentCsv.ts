import {
  LEVEL_LABEL,
  LEVELS,
  STUDENT_STATUS_LABEL,
  STUDENT_STATUSES,
  studentFormSchema,
  type StudentFormInput,
  type StudentFormValues,
} from '@lms/api-client'
import Papa from 'papaparse'

type Field = keyof StudentFormInput

export const CSV_FIELDS: { field: Field; label: string; required: boolean; aliases: string[] }[] = [
  { field: 'name', label: '이름', required: true, aliases: ['name'] },
  { field: 'email', label: '이메일', required: true, aliases: ['email'] },
  {
    field: 'phone',
    label: '휴대폰 번호',
    required: true,
    aliases: ['phone', '전화번호', '휴대폰'],
  },
  { field: 'company', label: '고객사', required: true, aliases: ['company', '회사'] },
  { field: 'department', label: '부서', required: false, aliases: ['department'] },
  { field: 'level', label: '레벨', required: true, aliases: ['level'] },
  { field: 'status', label: '수강 상태', required: false, aliases: ['status', '상태'] },
  { field: 'enrolledAt', label: '수강 시작일', required: true, aliases: ['enrolledAt', '시작일'] },
  { field: 'memo', label: '메모', required: false, aliases: ['memo', '비고'] },
]

export const MAX_ROWS = 500

const normalize = (value: string) => value.replace(/\s/g, '').toLowerCase()

/** 헤더 이름(영문 키·한글 라벨·별칭) → 필드 */
const HEADER_TO_FIELD = new Map<string, Field>(
  CSV_FIELDS.flatMap(({ field, label, aliases }) =>
    [field, label, ...aliases].map((name) => [normalize(name), field] as const),
  ),
)

/** 레벨/상태는 코드(ADVANCED)와 한글 라벨(고급) 둘 다 허용 */
function toCode<T extends string>(value: string, codes: readonly T[], labels: Record<T, string>) {
  const trimmed = value.trim()
  const byCode = codes.find((code) => code === trimmed.toUpperCase())
  if (byCode) return byCode
  return codes.find((code) => labels[code] === trimmed) ?? trimmed
}

export type ImportRow =
  | { line: number; input: StudentFormInput; ok: true; values: StudentFormValues }
  | { line: number; input: StudentFormInput; ok: false; errors: Partial<Record<Field, string>> }

export type ParseResult = { ok: true; rows: ImportRow[] } | { ok: false; message: string }

/**
 * CSV 텍스트를 행 단위로 검증한다.
 * 검증 규칙은 등록 폼과 같은 studentFormSchema를 쓰고, 파일 내 이메일 중복도 잡는다.
 * (DB에 이미 있는 이메일은 서버가 업로드 시점에 다시 검사한다.)
 */
export function parseStudentCsv(text: string): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(text.replace(/^\uFEFF/, ''), {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => HEADER_TO_FIELD.get(normalize(header)) ?? header,
  })

  const headers = new Set(parsed.meta.fields ?? [])
  const missing = CSV_FIELDS.filter((f) => f.required && !headers.has(f.field))
  if (missing.length > 0) {
    return {
      ok: false,
      message: `필수 열이 없습니다: ${missing.map((f) => f.label).join(', ')}`,
    }
  }
  if (parsed.data.length === 0) return { ok: false, message: '데이터 행이 없습니다.' }
  if (parsed.data.length > MAX_ROWS) {
    return { ok: false, message: `한 번에 최대 ${MAX_ROWS}행까지 업로드할 수 있습니다.` }
  }

  const seenEmails = new Map<string, number>()

  const rows = parsed.data.map((record, index): ImportRow => {
    const line = index + 2 // 1행은 헤더
    const cell = (field: Field) => (record[field] ?? '').trim()
    const input: StudentFormInput = {
      name: cell('name'),
      email: cell('email'),
      phone: cell('phone'),
      company: cell('company'),
      department: cell('department'),
      level: toCode(cell('level'), LEVELS, LEVEL_LABEL) as StudentFormInput['level'],
      status: (cell('status')
        ? toCode(cell('status'), STUDENT_STATUSES, STUDENT_STATUS_LABEL)
        : 'ACTIVE') as StudentFormInput['status'],
      enrolledAt: cell('enrolledAt'),
      memo: cell('memo'),
    }

    const result = studentFormSchema.safeParse(input)
    if (!result.success) {
      const errors: Partial<Record<Field, string>> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as Field
        errors[field] ??= issue.message
      }
      return { line, input, ok: false, errors }
    }

    const firstLine = seenEmails.get(result.data.email)
    if (firstLine !== undefined) {
      return { line, input, ok: false, errors: { email: `${firstLine}행과 이메일이 중복됩니다.` } }
    }
    seenEmails.set(result.data.email, line)
    return { line, input, ok: true, values: result.data }
  })

  return { ok: true, rows }
}

/** 오류 리포트 CSV: 행 번호, 원본 값, 오류 메시지. 엑셀 한글 깨짐 방지를 위해 BOM을 붙인다. */
export function buildErrorReport(rows: ImportRow[]): string {
  const failed = rows.filter((row): row is Extract<ImportRow, { ok: false }> => !row.ok)
  const csv = Papa.unparse({
    fields: ['행', ...CSV_FIELDS.map((f) => f.label), '오류'],
    data: failed.map((row) => [
      row.line,
      ...CSV_FIELDS.map((f) => row.input[f.field]),
      Object.entries(row.errors)
        .map(
          ([field, message]) => `${CSV_FIELDS.find((f) => f.field === field)?.label}: ${message}`,
        )
        .join(' / '),
    ]),
  })
  return `\uFEFF${csv}`
}

export function buildTemplate(): string {
  const csv = Papa.unparse({
    fields: CSV_FIELDS.map((f) => f.label),
    data: [
      [
        '홍길동',
        'gildong.hong@example.com',
        '010-1234-5678',
        '한빛전자',
        '인사팀',
        '중급',
        '수강중',
        '2026-11-02',
        '',
      ],
    ],
  })
  return `\uFEFF${csv}`
}

/**
 * 엑셀에서 "CSV"로 저장하면 한글 Windows에서는 CP949(EUC-KR)인 경우가 많다.
 * UTF-8로 먼저 엄격하게 디코딩해 보고, 실패하면 EUC-KR로 다시 읽는다.
 */
export function decodeCsv(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer)
  } catch {
    return new TextDecoder('euc-kr').decode(buffer)
  }
}
