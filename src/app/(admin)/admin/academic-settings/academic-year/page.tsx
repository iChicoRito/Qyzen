'use client'

import { useEffect, useState } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  createAcademicYear,
  deleteAcademicYear,
  fetchAcademicYears,
} from '@/lib/supabase/academic-settings'
import { getColumns } from './components/columns'
import { DataTable } from './components/data-table'
import { academicYearSchema, type AcademicYear } from './data/schema'

// AcademicYearPage - manage academic year records
export default function AcademicYearPage() {
  // ==================== STATE ====================
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // loadAcademicYears - fetch academic year data
  const loadAcademicYears = async () => {
    try {
      setLoading(true)
      setError(null)
      const academicYearList = await fetchAcademicYears()
      setAcademicYears(academicYearSchema.array().parse(academicYearList))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load academic years.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAcademicYears()
  }, [])

  // handleAddAcademicYear - add a new academic year row
  const handleAddAcademicYear = async (newAcademicYear: AcademicYear) => {
    const createdAcademicYear = await createAcademicYear(newAcademicYear)
    setAcademicYears((prev) => [createdAcademicYear, ...prev])
  }

  // handleDeleteAcademicYear - remove academic year row
  const handleDeleteAcademicYear = async (academicYear: AcademicYear) => {
    await deleteAcademicYear(academicYear.academicYear)
    setAcademicYears((prev) =>
      prev.filter((item) => item.academicYear !== academicYear.academicYear)
    )
  }

  if (loading) {
    return (
      <div className="hidden h-full flex-1 flex-col space-y-6 px-4 md:flex md:px-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-56" />
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
            <CardTitle>Academic Year Management</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="outline" className="cursor-pointer" onClick={loadAcademicYears}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <div className="px-4 md:hidden md:px-6">
        <div className="flex h-96 items-center justify-center rounded-lg border bg-muted/20">
          <div className="p-8 text-center">
            <h3 className="mb-2 text-lg font-semibold">Academic Year Management</h3>
            <p className="text-muted-foreground">
              Please use a larger screen to view the full academic year interface.
            </p>
          </div>
        </div>
      </div>

      <div className="hidden h-full flex-1 flex-col space-y-6 px-4 md:flex md:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Academic Year Management</CardTitle>
            <CardDescription>
              View, filter, and manage academic year records in one place.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={academicYears}
              columns={getColumns({ onDeleteAcademicYear: handleDeleteAcademicYear })}
              onAddAcademicYear={handleAddAcademicYear}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
