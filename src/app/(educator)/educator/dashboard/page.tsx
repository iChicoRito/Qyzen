import { DashboardRealtimeShell } from '@/app/(admin)/admin/dashboard/components/dashboard-realtime-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getServerAuthContext } from '@/lib/auth/server'
import { fetchEducatorDashboardAnalytics } from '@/lib/supabase/educator-dashboard'

import { EducatorAssessmentOverviewCard } from './components/educator-assessment-overview'
import { EducatorModuleOverviewCard } from './components/educator-module-overview'
import { EducatorSectionOverviewCard } from './components/educator-section-overview'
import { EducatorSummaryCards } from './components/educator-summary-cards'
import { EducatorTopStudentsCard } from './components/educator-top-students'

// EducatorDashboardPage - render the live educator dashboard
export default async function EducatorDashboardPage() {
  try {
    const context = await getServerAuthContext()

    if (!context) {
      throw new Error('Educator profile was not found.')
    }

    const analytics = await fetchEducatorDashboardAnalytics(context.profile.id)

    return (
      <div className="flex-1 px-4 pt-0 md:px-6">
        <div className="space-y-2">
          <h1 className="text-lg font-bold tracking-tight">Educator Dashboard</h1>
          <p className="text-sm text-muted-foreground mb-5">
            Real-time classroom monitoring for sections, subjects, modules, quizzes, and student performance.
          </p>
        </div>

        <DashboardRealtimeShell showStatusBadge={false}>
          <div className="space-y-4">
            <EducatorSummaryCards cards={analytics.summaryCards} />

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <EducatorAssessmentOverviewCard assessmentOverview={analytics.assessmentOverview} />
              <EducatorTopStudentsCard students={analytics.topStudents} />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <EducatorSectionOverviewCard sections={analytics.sectionInsights} />
              <EducatorModuleOverviewCard modules={analytics.moduleInsights} />
            </div>
          </div>
        </DashboardRealtimeShell>
      </div>
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load educator dashboard.'

    return (
      <div className="flex-1 px-4 pt-0 md:px-6">
        <Card>
          <CardHeader className="px-4 pt-4">
            <CardTitle className="text-lg">Dashboard unavailable</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-sm text-muted-foreground">{message}</p>
          </CardContent>
        </Card>
      </div>
    )
  }
}
