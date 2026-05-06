import Link from 'next/link'
import {
  IconChecklist,
  IconClock,
  IconPlayerPlay,
  IconRotateClockwise,
  IconSchool,
} from '@tabler/icons-react'

import type { StudentNextAssessment } from '@/lib/supabase/student-dashboard-types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

// getAssessmentBadgeClassName - return the assessment status badge styling
function getAssessmentBadgeClassName(canTake: boolean, isFinished: boolean) {
  if (canTake) {
    return 'rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500'
  }

  if (isFinished) {
    return 'rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500'
  }

  return 'rounded-md border-0 bg-yellow-500/10 px-2.5 py-0.5 text-yellow-500'
}

// StudentNextAssessmentCard - render the next available assessment summary
export function StudentNextAssessmentCard({ nextAssessment }: { nextAssessment: StudentNextAssessment | null }) {
  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="px-4 pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>Next Assessment</CardTitle>
            <CardDescription>See the assessment you can take next or the one coming up soon.</CardDescription>
          </div>
          {nextAssessment ? (
            <Badge className={getAssessmentBadgeClassName(nextAssessment.canTake, nextAssessment.isFinished)}>
              {nextAssessment.canTake ? 'Available now' : nextAssessment.isFinished ? 'Finished' : 'Upcoming'}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4">
        {nextAssessment ? (
          <>
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  <IconSchool className="h-3.5 w-3.5" />
                  Featured assessment
                </span>
                <span className="text-sm font-medium text-muted-foreground">{nextAssessment.quizTypeLabel}</span>
              </div>
              <div className="mt-3 space-y-1">
                <div className="text-xl font-semibold tracking-tight">{nextAssessment.moduleCode}</div>
                <div className="text-sm text-muted-foreground">
                  {nextAssessment.subjectName} in {nextAssessment.sectionName}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <IconClock className="h-4 w-4" />
                  {nextAssessment.schedule}
                </span>
                <span className="flex items-center gap-1.5">
                  <IconChecklist className="h-4 w-4" />
                  {nextAssessment.questionCount.toLocaleString()} questions
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Educator</p>
                <p className="mt-2 text-sm font-medium">{nextAssessment.educatorName}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Time Limit</p>
                <p className="mt-2 text-sm font-medium">{nextAssessment.timeLimitMinutes.toLocaleString()} min</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Retakes</p>
                <p className="mt-2 text-sm font-medium">{nextAssessment.remainingRetakes.toLocaleString()} left</p>
              </div>
            </div>

            <div className="rounded-lg border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
              <p className="mt-2 text-sm font-medium leading-relaxed">{nextAssessment.availabilityMessage}</p>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No assessments available yet.
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-3 px-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <IconRotateClockwise className="h-4 w-4" />
          <span>{nextAssessment ? `${nextAssessment.remainingRetakes} retake(s) remaining` : 'Check back later'}</span>
        </div>
        {nextAssessment ? (
          <Button asChild size="sm" className="w-full sm:w-auto">
            <Link href="/student/assessment/quiz">
              <IconPlayerPlay className="mr-2 h-4 w-4" />
              {nextAssessment.canTake ? 'Start Quiz' : 'Open Assessments'}
            </Link>
          </Button>
        ) : (
          <Button disabled size="sm" className="w-full sm:w-auto">
            <IconPlayerPlay className="mr-2 h-4 w-4" />
            Open Assessments
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
