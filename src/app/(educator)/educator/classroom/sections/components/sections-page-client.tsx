'use client'

import { useEffect, useState } from 'react'
import {
  IconArrowUp,
  IconBooks,
  IconChecklist,
  IconSchool,
  IconUsersGroup,
} from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { type SectionPermissions } from '@/lib/auth/section-permissions'
import {
  createSection,
  fetchSections,
  type SectionCreateInput,
  type SectionRecord,
} from '@/lib/supabase/sections'

import { type Section } from '../data/schema'
import { sectionSchema } from '../data/schema'
import { getColumns } from './columns'
import { DataTable } from './data-table'

interface SectionsPageClientProps {
  permissions: SectionPermissions
}

// SectionsPageClient - manage educator sections with rbac
export function SectionsPageClient({ permissions }: SectionsPageClientProps) {
  // ==================== STATE ====================
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ==================== LOAD DATA ====================
  const loadSections = async () => {
    try {
      setLoading(true)
      setError(null)
      const sectionList = await fetchSections()
      setSections(sectionSchema.array().parse(sectionList))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load sections.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSections()
  }, [])

  // handleAddSection - create a new section
  const handleAddSection = async (newSection: SectionCreateInput) => {
    const createdSection = await createSection(newSection)
    setSections((prev) => [sectionSchema.parse(createdSection), ...prev])
  }

  // handleUpdateSection - update existing section
  const handleUpdateSection = async (updatedSection: SectionRecord) => {
    setSections((prev) =>
      prev.map((section) => (section.id === updatedSection.id ? sectionSchema.parse(updatedSection) : section))
    )
  }

  // handleDeleteSection - remove deleted section
  const handleDeleteSection = (sectionId: number) => {
    setSections((prev) => prev.filter((section) => section.id !== sectionId))
  }

  // ==================== STATS ====================
  const stats = {
    total: sections.length,
    active: sections.filter((section) => section.status === 'active').length,
    inactive: sections.filter((section) => section.status === 'inactive').length,
    termLinks: sections.reduce((total, section) => total + section.academicTerms.length, 0),
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
      <div className="hidden h-full flex-1 flex-col space-y-6 px-4 md:flex md:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Section Management</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="outline" className="cursor-pointer" onClick={loadSections}>
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
        <h1 className="text-2xl font-bold tracking-tight">Sections</h1>
        <p className="text-muted-foreground">
          Create and manage your classroom sections across multiple academic terms.
        </p>
      </div>

      <div className="px-4 md:hidden md:px-6">
        <div className="flex h-96 items-center justify-center rounded-lg border bg-muted/20">
          <div className="p-8 text-center">
            <h3 className="mb-2 text-lg font-semibold">Section Management</h3>
            <p className="text-muted-foreground">
              Please use a larger screen to view the full section management interface.
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
                  <p className="text-sm font-medium text-muted-foreground">Total Sections</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Active Sections</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Inactive Sections</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Term Links</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stats.termLinks}</span>
                    <span className="flex items-center gap-0.5 text-sm text-blue-500">
                      <IconBooks size={14} />
                      Assigned
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <IconBooks size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Section Management</CardTitle>
            <CardDescription>
              View, filter, and manage your educator-owned section records in one place.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={sections}
              columns={getColumns({
                permissions,
                onUpdateSection: handleUpdateSection,
                onDeleteSection: handleDeleteSection,
              })}
              onAddSection={permissions.canCreate ? handleAddSection : undefined}
              permissions={permissions}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
