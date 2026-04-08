import { AdminInsightsPanel } from './components/admin-insights-panel'
import { AssessmentStatusBreakdown } from './components/assessment-status-breakdown'
import { AdminSummaryCards } from './components/admin-summary-cards'
import { DashboardRealtimeShell } from './components/dashboard-realtime-shell'
import { TopStudentsPanel } from './components/top-students-panel'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchAdminDashboardAnalytics } from '@/lib/supabase/admin-dashboard'

// DashboardPage - render the admin dashboard with server analytics
export default async function DashboardPage() {
  try {
    const analytics = await fetchAdminDashboardAnalytics()

    return (
      <div className="flex-1 px-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time academic monitoring for students, educators, sections, subjects, and assessments.
          </p>
        </div>

        <DashboardRealtimeShell>
          <AdminSummaryCards cards={analytics.summaryCards} />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <AssessmentStatusBreakdown
              assessmentOverview={analytics.assessmentOverview}
              chartData={analytics.assessmentStatusChart}
            />
            <TopStudentsPanel students={analytics.topStudents} />
          </div>

          <AdminInsightsPanel
            studentChartData={analytics.studentInsights.chartData}
            studentMetrics={analytics.studentInsights.metrics}
            educatorRows={analytics.educatorInsights}
            assessmentRows={analytics.assessmentInsights}
          />
        </DashboardRealtimeShell>
      </div>
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load admin dashboard.'

    return (
      <div className="flex-1 px-4 pt-0 md:px-6">
        <Card className="border-border/60 bg-card">
          <CardHeader className="px-4 pt-4">
            <CardTitle className="text-base">Dashboard unavailable</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-muted-foreground text-sm">{message}</p>
          </CardContent>
        </Card>
      </div>
    )
  }
}
