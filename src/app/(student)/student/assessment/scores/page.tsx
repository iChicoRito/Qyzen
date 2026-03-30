import { requireServerAuthContext } from '@/lib/auth/server'
import {
  QUIZ_RESULT_PASSING_PERCENTAGE,
  fetchStudentScoreResult,
} from '@/lib/supabase/student-quiz'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ScoresPageProps {
  searchParams: Promise<{
    scoreId?: string
  }>
}

// getStatusClassName - resolve score status badge color
function getStatusClassName(status: 'passed' | 'failed') {
  if (status === 'passed') {
    return 'rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500'
  }

  return 'rounded-md border-0 bg-rose-500/10 px-2.5 py-0.5 text-rose-500'
}

// ScoresPage - show latest or selected student score result
export default async function ScoresPage({ searchParams }: ScoresPageProps) {
  // ==================== LOAD DATA ====================
  const params = await searchParams
  const scoreId = params.scoreId ? Number(params.scoreId) : undefined
  const context = await requireServerAuthContext('student')
  const result = await fetchStudentScoreResult(context.profile.id, scoreId)

  // ==================== RENDER EMPTY ====================
  if (!result) {
    return (
      <div className="@container/main flex flex-1 flex-col px-4 py-6 md:px-6">
        <Card>
          <CardHeader>
            <CardTitle>No score available yet</CardTitle>
            <CardDescription>
              Finish an assessment first to see your result here.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // ==================== RENDER ====================
  return (
    <div className="@container/main flex flex-1 flex-col px-4 py-6 md:px-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>{result.subjectName}</CardTitle>
          <CardDescription>
            {result.sectionName} - {result.moduleCode} - {result.termName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={getStatusClassName(result.status)}>{result.status}</Badge>
            <Badge variant="outline">{result.educatorName}</Badge>
            <Badge variant="outline">Passing: {QUIZ_RESULT_PASSING_PERCENTAGE}%</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border p-4">
              <div className="text-muted-foreground text-sm">Score</div>
              <div className="mt-2 text-2xl font-bold">
                {result.score} / {result.totalQuestions}
              </div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-muted-foreground text-sm">Percentage</div>
              <div className="mt-2 text-2xl font-bold">{result.percentage}%</div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-muted-foreground text-sm">Submitted At</div>
              <div className="mt-2 text-base font-semibold">
                {result.submittedAt || 'Not submitted'}
              </div>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-sm font-semibold">Result Summary</div>
            <div className="text-muted-foreground mt-2 text-sm">
              {result.isPassed
                ? 'You passed this assessment. Review your result and continue to the next module.'
                : 'You did not reach the passing score for this assessment yet.'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
