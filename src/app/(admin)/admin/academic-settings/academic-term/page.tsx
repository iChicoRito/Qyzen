'use client'

import { useEffect, useState } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  createAcademicTerm,
  deleteAcademicTerm,
  fetchAcademicTerms,
  fetchAcademicYears,
} from '@/lib/supabase/academic-settings'
import { getColumns } from './components/columns'
import { DataTable } from './components/data-table'
import { academicTermSchema, type AcademicTerm } from './data/schema'

// AcademicTermPage - manage academic term records
export default function AcademicTermPage() {
  // ==================== STATE ====================
  const [academicTerms, setAcademicTerms] = useState<AcademicTerm[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [academicYearOptions, setAcademicYearOptions] = useState<Array<{ value: string; label: string }>>([])

  // loadAcademicTermData - fetch academic term and year data
  const loadAcademicTermData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [academicTermList, academicYearList] = await Promise.all([
        fetchAcademicTerms(),
        fetchAcademicYears(),
      ])

      setAcademicTerms(academicTermSchema.array().parse(academicTermList))
      setAcademicYearOptions(
        academicYearList.map((academicYear) => ({
          value: academicYear.academicYear,
          label: academicYear.academicYear,
        }))
      )
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load academic terms.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAcademicTermData()
  }, [])

  // handleAddAcademicTerm - add a new academic term row
  const handleAddAcademicTerm = async (newAcademicTerm: AcademicTerm) => {
    const createdAcademicTerm = await createAcademicTerm(newAcademicTerm)
    setAcademicTerms((prev) => [createdAcademicTerm, ...prev])
  }

  // handleDeleteAcademicTerm - remove academic term row
  const handleDeleteAcademicTerm = async (academicTerm: AcademicTerm) => {
    await deleteAcademicTerm(academicTerm)
    setAcademicTerms((prev) =>
      prev.filter(
        (item) =>
          !(
            item.academicTermName === academicTerm.academicTermName &&
            item.semester === academicTerm.semester &&
            item.academicYear === academicTerm.academicYear
          )
      )
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
            <CardTitle>Academic Term Management</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="outline" className="cursor-pointer" onClick={loadAcademicTermData}>
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
            <h3 className="mb-2 text-lg font-semibold">Academic Term Management</h3>
            <p className="text-muted-foreground">
              Please use a larger screen to view the full academic term interface.
            </p>
          </div>
        </div>
      </div>

      <div className="hidden h-full flex-1 flex-col space-y-6 px-4 md:flex md:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Academic Term Management</CardTitle>
            <CardDescription>
              View, filter, and manage academic term records in one place.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={academicTerms}
              columns={getColumns({ onDeleteAcademicTerm: handleDeleteAcademicTerm })}
              academicYearOptions={academicYearOptions}
              onAddAcademicTerm={handleAddAcademicTerm}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
