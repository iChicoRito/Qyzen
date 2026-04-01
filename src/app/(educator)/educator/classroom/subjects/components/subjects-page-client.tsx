'use client'

import { useEffect, useState } from 'react'
import {
  IconArrowUp,
  IconBook2,
  IconChecklist,
  IconFolders,
  IconUsersGroup,
} from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { type SubjectPermissions } from '@/lib/auth/subject-permissions'
import {
  createSubject,
  fetchSubjects,
  type SubjectCreateInput,
  type SubjectRecord,
} from '@/lib/supabase/subjects'

import { type Subject } from '../data/schema'
import { subjectSchema } from '../data/schema'
import { getColumns } from './columns'
import { DataTable } from './data-table'

interface SubjectsPageClientProps {
  permissions: SubjectPermissions
}

// SubjectsPageClient - manage educator subjects with rbac
export function SubjectsPageClient({ permissions }: SubjectsPageClientProps) {
  // ==================== STATE ====================
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ==================== LOAD DATA ====================
  const loadSubjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const subjectList = await fetchSubjects()
      setSubjects(subjectSchema.array().parse(subjectList))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load subjects.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSubjects()
  }, [])

  // handleAddSubject - create a new subject
  const handleAddSubject = async (newSubject: SubjectCreateInput) => {
    const createdSubject = await createSubject(newSubject)
    setSubjects((prev) => [subjectSchema.parse(createdSubject), ...prev])
  }

  // handleUpdateSubject - update existing subject
  const handleUpdateSubject = async (previousRowIds: number[], updatedSubject: SubjectRecord) => {
    setSubjects((prev) =>
      prev.map((subject) =>
        subject.rowIds.some((rowId) => previousRowIds.includes(rowId))
          ? subjectSchema.parse(updatedSubject)
          : subject
      )
    )
  }

  // handleDeleteSubject - remove deleted subject
  const handleDeleteSubject = (rowIds: number[]) => {
    setSubjects((prev) =>
      prev.filter((subject) => !subject.rowIds.some((rowId) => rowIds.includes(rowId)))
    )
  }

  // ==================== STATS ====================
  const stats = {
    total: subjects.length,
    active: subjects.filter((subject) => subject.status === 'active').length,
    inactive: subjects.filter((subject) => subject.status === 'inactive').length,
    sectionLinks: subjects.reduce((total, subject) => total + subject.sections.length, 0),
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
            <CardTitle>Subject Management</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="outline" className="cursor-pointer" onClick={loadSubjects}>
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
        <h1 className="text-2xl font-bold tracking-tight">Subjects</h1>
        <p className="text-muted-foreground">
          Create and manage your subject assignments across multiple classroom sections.
        </p>
      </div>

      <div className="flex min-w-0 flex-1 flex-col space-y-6 px-4 md:px-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Subjects</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stats.total}</span>
                    <span className="flex items-center gap-0.5 text-sm text-green-500">
                      <IconArrowUp size={14} />
                      {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <IconBook2 size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Subjects</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Inactive Subjects</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stats.inactive}</span>
                    <span className="flex items-center gap-0.5 text-sm text-yellow-500">
                      <IconChecklist size={14} />
                      {stats.total > 0 ? Math.round((stats.inactive / stats.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <IconChecklist size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Section Links</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stats.sectionLinks}</span>
                    <span className="flex items-center gap-0.5 text-sm text-blue-500">
                      <IconFolders size={14} />
                      Assigned
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <IconFolders size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Subject Management</CardTitle>
            <CardDescription>
              View, filter, and manage your educator-owned subject records in one place.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={subjects}
              columns={getColumns({
                permissions,
                onUpdateSubject: handleUpdateSubject,
                onDeleteSubject: handleDeleteSubject,
              })}
              onAddSubject={permissions.canCreate ? handleAddSubject : undefined}
              permissions={permissions}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
