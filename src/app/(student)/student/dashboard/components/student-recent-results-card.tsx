import { IconCheck, IconX } from '@tabler/icons-react'

import type { StudentRecentResult } from '@/lib/supabase/student-dashboard-types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// getScoreBadgeClassName - return the score badge styling
function getScoreBadgeClassName(scorePercentage: number) {
  if (scorePercentage >= 75) {
    return 'rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500'
  }

  if (scorePercentage >= 50) {
    return 'rounded-md border-0 bg-yellow-500/10 px-2.5 py-0.5 text-yellow-500'
  }

  return 'rounded-md border-0 bg-rose-500/10 px-2.5 py-0.5 text-rose-500'
}

// StudentRecentResultsCard - render the latest finished assessments
export function StudentRecentResultsCard({ results }: { results: StudentRecentResult[] }) {
  return (
    <Card>
      <CardHeader className="px-4 pt-4">
        <CardTitle>Recent Results</CardTitle>
        <CardDescription>Your latest submitted assessments and scores.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4">
        {results.length > 0 ? (
          results.map((result) => (
            <div key={result.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{result.moduleCode}</div>
                  <div className="text-sm text-muted-foreground">
                    {result.subjectName} in {result.sectionName}
                  </div>
                </div>
                <Badge className={getScoreBadgeClassName(result.scorePercentage)}>{result.scorePercentage.toFixed(1)}%</Badge>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  {result.statusLabel === 'finished' ? (
                    <IconCheck className="h-4 w-4 text-green-500" />
                  ) : (
                    <IconX className="h-4 w-4 text-rose-500" />
                  )}
                  {result.attemptCount} attempt(s)
                </span>
                <span>{result.submittedAt || 'No submission yet'}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No completed assessments yet.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
