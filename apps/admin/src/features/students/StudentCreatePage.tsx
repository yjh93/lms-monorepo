import { studentFormDefaults } from '@lms/api-client'
import { useCreateStudent } from '@lms/api-client/query'
import { useNavigate } from 'react-router'
import { PageHeader } from '../../components/PageHeader'
import { StudentForm } from './StudentForm'

export function StudentCreatePage() {
  const navigate = useNavigate()
  const createStudent = useCreateStudent()

  return (
    <>
      <PageHeader title="수강생 등록" />
      <StudentForm
        defaultValues={{
          ...studentFormDefaults,
          enrolledAt: new Date().toISOString().slice(0, 10),
        }}
        submitLabel="등록"
        onSubmit={async (values) => {
          await createStudent.mutateAsync(values)
          navigate('/students')
        }}
        onCancel={() => navigate(-1)}
      />
    </>
  )
}
