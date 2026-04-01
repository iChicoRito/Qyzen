'use client'

import { useEffect, useState } from 'react'
import { IconChecklist, IconPercentage, IconReportAnalytics, IconUsersGroup } from '@tabler/icons-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchEducatorScoreReviewList } from '@/lib/supabase/educator-scores'

import { columns } from './columns'
import { DataTable } from './data-table'
import { educatorScoreSchema, type EducatorScore } from '../data/schema'

// ScoresPageClient - render educator score monitoring
export function ScoresPageClient() {
  // ==================== STATE ====================
  const [scores, setScores] = useState<EducatorScore[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ==================== LOAD SCORES ====================
  // loadScores - fetch educator score rows
  const loadScores = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const scoreList = await fetchEducatorScoreReviewList()
      setScores(educatorScoreSchema.array().parse(scoreList))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load student scores.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadScores()
  }, [])

  const passedCount = scores.filter((score) => score.status === 'passed').length
  const averagePercentage = scores.length > 0
    ? Math.round(scores.reduce((total, score) => total + score.percentage, 0) / scores.length)
    : 0
  const uniqueStudents = new Set(scores.map((score) => score.studentId)).size

  if (isLoading) {
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </CardHeader>
          <CardContent className="min-w-0 px-3 pb-4 sm:px-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="mt-4 h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-6">
        <Card>
          <CardContent className="py-10 text-center">
            <div className="text-base font-medium">{error}</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 md:px-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Student Scores</h1>
        <p className="text-muted-foreground">
          Monitor submitted assessment attempts from students actively enrolled under your subjects.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <div className="text-muted-foreground text-sm font-medium">Total Attempts</div>
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
              <div className="text-muted-foreground text-sm font-medium">Students</div>
              <div className="mt-2 text-2xl font-semibold">{uniqueStudents}</div>
            </div>
            <div className="rounded-lg border p-3">
              <IconUsersGroup size={22} />
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
          <CardTitle>Score Monitoring</CardTitle>
          <CardDescription>
            Review submitted attempts, inspect answers, and grant extra retake chances when needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="min-w-0 px-3 pb-4 sm:px-6">
          <DataTable data={scores} columns={columns(loadScores)} />
        </CardContent>
      </Card>
    </div>
  )
}
