import { DashboardRealtimeShell } from '@/app/(admin)/admin/dashboard/components/dashboard-realtime-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requireServerAuthContext } from '@/lib/auth/server'
import { fetchStudentLearningMaterialGroups } from '@/lib/supabase/learning-materials'
import { fetchStudentAssessments } from '@/lib/supabase/student-assessments'
import { buildStudentDashboardAnalytics } from '@/lib/supabase/student-dashboard'

import { StudentNextAssessmentCard } from './components/student-next-assessment-card'
import { StudentPerformanceTrendCard } from './components/student-performance-trend-card'
import { StudentProgressCard } from './components/student-progress-card'
import { StudentSummaryCards } from './components/student-summary-cards'

// StudentDashboardPage - render the live student dashboard
export default async function StudentDashboardPage() {
  try {
    const context = await requireServerAuthContext('student')

    const [assessments, learningMaterials] = await Promise.all([
      fetchStudentAssessments(context.profile.id),
      fetchStudentLearningMaterialGroups(context.profile.id),
    ])

    const analytics = buildStudentDashboardAnalytics(assessments, learningMaterials)

    return (
      <div className="flex-1 px-4 pt-0 md:px-6">
        <div className="space-y-2">
          <h1 className="text-lg font-bold tracking-tight">Student Dashboard</h1>
          <p className="text-sm text-muted-foreground mb-5">
            Track your assessments and progress in one place.
          </p>
        </div>

        <DashboardRealtimeShell showStatusBadge={false}>
          <div className="space-y-4">
            <StudentSummaryCards cards={analytics.summaryCards} />

            <StudentPerformanceTrendCard trend={analytics.performanceTrend} />

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <StudentNextAssessmentCard nextAssessment={analytics.nextAssessment} />
              <StudentProgressCard progress={analytics.progress} />
            </div>
          </div>
        </DashboardRealtimeShell>
      </div>
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load student dashboard.'

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
