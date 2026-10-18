import { LEVEL_LABEL, STUDENT_STATUS_LABEL, type Student } from '@lms/api-client'
import { Badge, createDataTableColumnHelper } from '@lms/ui'
import { formatDate, formatPhone } from '@lms/utils'
import { Link } from 'react-router'
import { STATUS_TONE } from './studentDisplay'

const column = createDataTableColumnHelper<Student>()

/**
 * 정렬 가능 컬럼은 서버가 지원하는 정렬 키(STUDENT_SORT_KEYS)와 id를 맞춘다.
 * 수정 권한이 없으면 이름을 링크 대신 텍스트로 보여준다.
 */
export const getStudentColumns = ({ canEdit }: { canEdit: boolean }) => [
  column.accessor('name', {
    header: '이름',
    cell: (info) =>
      canEdit ? (
        <Link
          to={`/students/${info.row.original.id}/edit`}
          className="text-brand-700 font-medium hover:underline"
        >
          {info.getValue()}
        </Link>
      ) : (
        <span className="font-medium">{info.getValue()}</span>
      ),
  }),
  column.accessor('email', { header: '이메일', enableSorting: false }),
  column.accessor('phone', {
    header: '전화번호',
    enableSorting: false,
    cell: (info) => formatPhone(info.getValue()),
    meta: { className: 'whitespace-nowrap' },
  }),
  column.accessor('company', {
    header: '고객사',
    cell: (info) => (
      <span>
        {info.getValue()}
        <span className="ml-1 text-xs text-gray-500">{info.row.original.department}</span>
      </span>
    ),
  }),
  column.accessor('level', {
    header: '레벨',
    enableSorting: false,
    cell: (info) => LEVEL_LABEL[info.getValue()],
  }),
  column.accessor('status', {
    header: '상태',
    enableSorting: false,
    cell: (info) => (
      <Badge tone={STATUS_TONE[info.getValue()]}>{STUDENT_STATUS_LABEL[info.getValue()]}</Badge>
    ),
  }),
  column.accessor('enrolledAt', {
    header: '수강 시작일',
    cell: (info) => formatDate(info.getValue()),
    meta: { className: 'whitespace-nowrap' },
  }),
  column.accessor('createdAt', {
    header: '등록일',
    cell: (info) => formatDate(info.getValue()),
    meta: { className: 'whitespace-nowrap' },
  }),
]
