'use client'

import { useEffect, useState } from 'react'
import {
  IconArrowUp,
  IconBooks,
  IconClockHour4,
  IconLayersLinked,
  IconToggleLeft,
} from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { type AssessmentPermissions } from '@/lib/auth/assessment-permissions'
import {
  createAssessments,
  fetchAssessments,
  type AssessmentCreateInput,
  type AssessmentRecord,
} from '@/lib/supabase/assessments'

import { type Assessment } from '../data/schema'
import { assessmentSchema } from '../data/schema'
import { getColumns } from './columns'
import { DataTable } from './data-table'

interface AssessmentsPageClientProps {
  permissions: AssessmentPermissions
}

// AssessmentsPageClient - manage educator assessments
export function AssessmentsPageClient({ permissions }: AssessmentsPageClientProps) {
  // ==================== STATE ====================
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ==================== LOAD DATA ====================
  const loadAssessments = async () => {
    try {
      setLoading(true)
      setError(null)
      const assessmentList = await fetchAssessments()
      setAssessments(assessmentSchema.array().parse(assessmentList))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load assessments.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAssessments()
  }, [])

  // handleAddAssessments - create new assessment rows
  const handleAddAssessments = async (input: AssessmentCreateInput) => {
    const createdAssessments = await createAssessments(input)
    const parsedAssessments = assessmentSchema.array().parse(createdAssessments)
    setAssessments((prev) => [...parsedAssessments, ...prev])
  }

  // handleDeleteAssessment - remove deleted assessment row
  const handleDeleteAssessment = (assessmentId: number) => {
    setAssessments((prev) => prev.filter((assessment) => assessment.id !== assessmentId))
  }

  // handleUpdateAssessment - replace the updated assessment row
  const handleUpdateAssessment = (updatedAssessment: AssessmentRecord) => {
    const parsedAssessment = assessmentSchema.parse(updatedAssessment)
    setAssessments((prev) =>
      prev.map((assessment) => (assessment.id === parsedAssessment.id ? parsedAssessment : assessment))
    )
  }

  // ==================== STATS ====================
  const stats = {
    total: assessments.length,
    active: assessments.filter((assessment) => assessment.status === 'active').length,
    shuffled: assessments.filter((assessment) => assessment.isShuffle).length,
    scheduled: assessments.filter((assessment) => assessment.startDate && assessment.endDate).length,
  }

  if (loading) {
    return (
      <div className="flex min-w-0 flex-1 flex-col space-y-6 px-4 md:px-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-w-0 flex-1 flex-col space-y-6 px-4 md:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Assessment Management</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="outline" className="cursor-pointer" onClick={loadAssessments}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ==================== RENDER ====================
  return (
    <>
      <div className="flex flex-col gap-2 px-4 md:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Assessments</h1>
        <p className="text-muted-foreground">
          Create assessments and assign them to one or more subject and section pairs.
        </p>
      </div>

      <div className="flex min-w-0 flex-1 flex-col space-y-6 px-4 md:px-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Assessments</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stats.total}</span>
                    <span className="flex items-center gap-0.5 text-sm text-green-500">
                      <IconArrowUp size={14} />
                      {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <IconBooks size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Assessments</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stats.active}</span>
                    <span className="flex items-center gap-0.5 text-sm text-green-500">
                      <IconLayersLinked size={14} />
                      Live
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <IconLayersLinked size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Shuffle Enabled</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stats.shuffled}</span>
                    <span className="flex items-center gap-0.5 text-sm text-blue-500">
                      <IconToggleLeft size={14} />
                      Enabled
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <IconToggleLeft size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stats.scheduled}</span>
                    <span className="flex items-center gap-0.5 text-sm text-yellow-500">
                      <IconClockHour4 size={14} />
                      Ready
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <IconClockHour4 size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Assessment Management</CardTitle>
            <CardDescription>
              View, filter, and create assessments with subject and section-based scheduling.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={assessments}
              columns={getColumns({
                permissions,
                onAssessmentUpdated: handleUpdateAssessment,
                onAssessmentDeleted: handleDeleteAssessment,
              })}
              onAddAssessments={permissions.canCreate ? handleAddAssessments : undefined}
              permissions={permissions}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}

