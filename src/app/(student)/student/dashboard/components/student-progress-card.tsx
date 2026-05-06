import {
  IconChartPie,
  IconRotateClockwise,
  IconSchool,
  IconTarget,
  IconTrendingUp,
} from '@tabler/icons-react'

import type { StudentProgressMetrics } from '@/lib/supabase/student-dashboard-types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

// StudentProgressCard - render the student progress summary
export function StudentProgressCard({ progress }: { progress: StudentProgressMetrics }) {
  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="px-4 pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>My Progress</CardTitle>
            <CardDescription>Track your completed work, pass rate, and score average.</CardDescription>
          </div>
          <Badge variant="outline" className="rounded-md px-2.5 py-1 text-xs">
            <IconTrendingUp className="h-3.5 w-3.5" />
            Progress snapshot
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4">
        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Average Score</p>
              <div className="text-3xl font-semibold tracking-tight tabular-nums">
                {progress.averageScore.toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground">Across your finished assessments</p>
            </div>
            <div className="rounded-xl border bg-background px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Completed</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{progress.completedAssessments.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border p-3">
            <div className="mb-2 flex items-center gap-2">
              <IconSchool className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Completed</span>
            </div>
            <div className="text-2xl font-semibold tabular-nums">{progress.completedAssessments.toLocaleString()}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="mb-2 flex items-center gap-2">
              <IconTarget className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Pass Rate</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="rounded-md border-border/60 bg-background px-2 py-1 text-xs">
                {progress.passRate.toFixed(1)}%
              </Badge>
            </div>
            <Progress className="mt-3 h-2" value={Math.max(0, Math.min(progress.passRate, 100))} />
          </div>
          <div className="rounded-lg border p-3">
            <div className="mb-2 flex items-center gap-2">
              <IconChartPie className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Average Score</span>
            </div>
            <div className="text-2xl font-semibold tabular-nums">{progress.averageScore.toFixed(1)}%</div>
          </div>
          <div className="rounded-lg border p-3 sm:col-span-3">
            <div className="mb-2 flex items-center gap-2">
              <IconRotateClockwise className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Remaining Retakes</span>
            </div>
            <div className="text-2xl font-semibold tabular-nums">{progress.remainingRetakes.toLocaleString()}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
