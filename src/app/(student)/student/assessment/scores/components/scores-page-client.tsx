'use client'

import { IconChecklist, IconPercentage, IconReportAnalytics, IconRosetteDiscountCheck } from '@tabler/icons-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { StudentQuizReviewListItem } from '@/lib/supabase/student-quiz'

import { columns } from './columns'
import { DataTable } from './data-table'

interface ScoresPageClientProps {
  scores: StudentQuizReviewListItem[]
}

// ScoresPageClient - render student score summaries and score table
export function ScoresPageClient({ scores }: ScoresPageClientProps) {
  const passedCount = scores.filter((score) => score.status === 'passed').length
  const failedCount = scores.filter((score) => score.status === 'failed').length
  const totalCorrectAnswers = scores.reduce((total, score) => total + score.score, 0)
  const totalQuestions = scores.reduce((total, score) => total + score.totalQuestions, 0)
  const averagePercentage = totalQuestions > 0
    ? Math.round((totalCorrectAnswers / totalQuestions) * 100)
    : 0

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 md:px-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Scores</h1>
        <p className="text-muted-foreground">
          Review your completed assessments, module results, and answered questions.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <div className="text-muted-foreground text-sm font-medium">Total Scores</div>
              <div className="mt-2 text-2xl font-semibold">{scores.length}</div>
            </div>
            <div className="rounded-lg border p-3">
              <IconChecklist size={22} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <div className="text-muted-foreground text-sm font-medium">Passed</div>
              <div className="mt-2 text-2xl font-semibold">{passedCount}</div>
            </div>
            <div className="rounded-lg border p-3">
              <IconRosetteDiscountCheck size={22} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <div className="text-muted-foreground text-sm font-medium">Failed</div>
              <div className="mt-2 text-2xl font-semibold">{failedCount}</div>
            </div>
            <div className="rounded-lg border p-3">
              <IconReportAnalytics size={22} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <div className="text-muted-foreground text-sm font-medium">Average</div>
              <div className="mt-2 text-2xl font-semibold">{averagePercentage}%</div>
            </div>
            <div className="rounded-lg border p-3">
              <IconPercentage size={22} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle>Student Scores</CardTitle>
          <CardDescription>
            Filter by module, subject, term, or status to review finished assessments.
          </CardDescription>
        </CardHeader>
        <CardContent className="min-w-0 px-3 pb-4 sm:px-6">
          <DataTable data={scores} columns={columns} />
        </CardContent>
      </Card>
    </div>
  )
}
