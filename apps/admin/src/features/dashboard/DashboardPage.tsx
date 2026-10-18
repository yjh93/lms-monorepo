import { useDashboard } from '@lms/api-client/query'
import { PageHeader } from '../../components/PageHeader'
import { AttendanceTrendChart } from './AttendanceTrendChart'
import { CompanyStatusChart } from './CompanyStatusChart'
import { KpiTiles } from './KpiTiles'

export function DashboardPage() {
  const dashboard = useDashboard()

  return (
    <>
      <PageHeader title="대시보드" description="수강 현황과 출석률을 한눈에 확인합니다." />
      {dashboard.isPending ? (
        <p className="py-12 text-center text-sm text-gray-500">불러오는 중…</p>
      ) : dashboard.isError ? (
        <p role="alert" className="text-danger-700 py-12 text-center text-sm">
          {dashboard.error.message}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <KpiTiles kpis={dashboard.data.kpis} />
          <div className="grid gap-4 xl:grid-cols-2">
            <AttendanceTrendChart data={dashboard.data.attendanceTrend} />
            <CompanyStatusChart data={dashboard.data.companyBreakdown} />
          </div>
        </div>
      )}
    </>
  )
}
