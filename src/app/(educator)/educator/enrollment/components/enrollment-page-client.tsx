'use client'

import { useEffect, useState } from 'react'
import {
  IconArrowUp,
  IconBook2,
  IconChecklist,
  IconSchool,
  IconUsersGroup,
} from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  createEnrollments,
  fetchEnrollments,
  type CreateEnrollmentInput,
  type EnrollmentRecord,
} from '@/lib/supabase/enrollments'

import { enrollmentSchema, type Enrollment } from '../data/schema'
import { getColumns } from './columns'
import { DataTable } from './data-table'

// EnrollmentPageClient - manage educator student enrollments
export function EnrollmentPageClient() {
  // ==================== STATE ====================
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // loadEnrollments - fetch educator enrollment rows
  const loadEnrollments = async () => {
    try {
      setLoading(true)
      setError(null)
      const enrollmentList = await fetchEnrollments()
      setEnrollments(enrollmentSchema.array().parse(enrollmentList))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load enrollments.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEnrollments()
  }, [])

  // handleAddEnrollment - append created rows
  const handleAddEnrollment = async (input: CreateEnrollmentInput) => {
    const createdEnrollments = await createEnrollments(input)
    setEnrollments((prev) => [
      ...createdEnrollments.map((enrollment) => enrollmentSchema.parse(enrollment)),
      ...prev,
    ])
  }

  // handleEnrollmentUpdated - replace updated row
  const handleEnrollmentUpdated = (updatedEnrollment: EnrollmentRecord) => {
    setEnrollments((prev) =>
      prev.map((enrollment) =>
        enrollment.id === updatedEnrollment.id ? enrollmentSchema.parse(updatedEnrollment) : enrollment
      )
    )
  }

  // handleEnrollmentDeleted - remove deleted row
  const handleEnrollmentDeleted = (id: number) => {
    setEnrollments((prev) => prev.filter((enrollment) => enrollment.id !== id))
  }

  // ==================== STATS ====================
  const stats = {
    total: enrollments.length,
    active: enrollments.filter((enrollment) => enrollment.status === 'active').length,
    uniqueStudents: new Set(enrollments.map((enrollment) => enrollment.student.id)).size,
    uniqueSubjects: new Set(enrollments.map((enrollment) => enrollment.subject.id)).size,
  }

  if (loading) {
    return (
      <div className="hidden h-full flex-1 flex-col space-y-6 px-4 md:flex md:px-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
            <Skeleton className="h-6 w-52" />
            <Skeleton className="h-4 w-80" />
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
      <div className="hidden h-full flex-1 flex-col space-y-6 px-4 md:flex md:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Enrollment Management</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="outline" className="cursor-pointer" onClick={loadEnrollments}>
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
        <h1 className="text-2xl font-bold tracking-tight">Enrollment</h1>
        <p className="text-muted-foreground">
          Enroll students into your assigned subjects and manage their active enrollment status.
        </p>
      </div>

      <div className="px-4 md:hidden md:px-6">
        <div className="flex h-96 items-center justify-center rounded-lg border bg-muted/20">
          <div className="p-8 text-center">
            <h3 className="mb-2 text-lg font-semibold">Enrollment Management</h3>
            <p className="text-muted-foreground">
              Please use a larger screen to view the full enrollment management interface.
            </p>
          </div>
        </div>
      </div>

      <div className="hidden h-full flex-1 flex-col space-y-6 px-4 md:flex md:px-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Enrollments</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stats.total}</span>
                    <span className="flex items-center gap-0.5 text-sm text-green-500">
                      <IconArrowUp size={14} />
                      {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <IconSchool size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stats.active}</span>
                    <span className="flex items-center gap-0.5 text-sm text-green-500">
                      <IconArrowUp size={14} />
                      {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <IconUsersGroup size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Students</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stats.uniqueStudents}</span>
                    <span className="flex items-center gap-0.5 text-sm text-blue-500">
                      <IconUsersGroup size={14} />
                      Enrolled
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <IconUsersGroup size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Subjects</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stats.uniqueSubjects}</span>
                    <span className="flex items-center gap-0.5 text-sm text-yellow-500">
                      <IconChecklist size={14} />
                      Assigned
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <IconBook2 size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Enrollment Management</CardTitle>
            <CardDescription>
              View, filter, and manage student enrollment records for your classroom subjects.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={enrollments}
              columns={getColumns({
                onEnrollmentUpdated: handleEnrollmentUpdated,
                onEnrollmentDeleted: handleEnrollmentDeleted,
              })}
              onAddEnrollment={handleAddEnrollment}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
