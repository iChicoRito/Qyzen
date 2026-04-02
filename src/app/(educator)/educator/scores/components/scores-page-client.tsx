'use client'

import { useEffect, useState } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchEducatorScoreReviewList } from '@/lib/supabase/educator-scores'

import { columns } from './columns'
import { DataTable } from './data-table'
import { DownloadGradesModal } from './download-grades-modal'
import { educatorScoreSchema, type EducatorScore } from '../data/schema'

// ScoresPageClient - render educator score monitoring
export function ScoresPageClient() {
  // ==================== STATE ====================
  const [scores, setScores] = useState<EducatorScore[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDownloadOpen, setIsDownloadOpen] = useState(false)

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

  if (isLoading) {
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-6">
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
    <div className="flex min-w-0 flex-1 flex-col px-4 py-6 md:px-6">
      <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle>Score Monitoring</CardTitle>
          <CardDescription>
            Review submitted attempts, inspect answers, and grant extra retake chances when needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="min-w-0 px-3 pb-4 sm:px-6">
          <DataTable data={scores} columns={columns(loadScores)} onDownloadGrades={() => setIsDownloadOpen(true)} />
        </CardContent>
      </Card>
      <DownloadGradesModal open={isDownloadOpen} onOpenChange={setIsDownloadOpen} />
    </div>
  )
}
