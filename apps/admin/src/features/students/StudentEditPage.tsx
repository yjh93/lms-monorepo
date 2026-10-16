import { toStudentFormInput } from '@lms/api-client'
import { useStudent, useUpdateStudent } from '@lms/api-client/query'
import { formatDateTime } from '@lms/utils'
import { useNavigate, useParams } from 'react-router'
import { PageHeader } from '../../components/PageHeader'
import { StudentForm } from './StudentForm'

export function StudentEditPage() {
  const { studentId = '' } = useParams()
  const navigate = useNavigate()
  const student = useStudent(studentId)
  const updateStudent = useUpdateStudent(studentId)

  if (student.isPending) {
    return <p className="py-12 text-center text-sm text-gray-500">불러오는 중…</p>
  }
  if (student.isError) {
    return (
      <p role="alert" className="text-danger-700 py-12 text-center text-sm">
        {student.error.message}
      </p>
    )
  }

  return (
    <>
      <PageHeader
        title={`${student.data.name} 수강생 수정`}
        description={`최근 수정: ${formatDateTime(student.data.updatedAt)}`}
      />
      <StudentForm
        // 다른 수강생으로 이동하면 폼 상태를 새로 초기화
        key={student.data.id}
        defaultValues={toStudentFormInput(student.data)}
        submitLabel="저장"
        onSubmit={async (values) => {
          await updateStudent.mutateAsync(values)
          navigate('/students')
        }}
        onCancel={() => navigate(-1)}
      />
    </>
  )
}
