'use client'

import { useEffect, useState } from 'react'
import { z } from 'zod'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { columns } from './components/columns'
import { DataTable } from './components/data-table'
import { academicYearSchema, type AcademicYear } from './data/schema'
import academicYearsData from './data/data.json'

// getAcademicYears - load static academic year data
async function getAcademicYears() {
  return z.array(academicYearSchema).parse(academicYearsData)
}

// AcademicYearPage - manage academic year records
export default function AcademicYearPage() {
  // ==================== STATE ====================
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // loadAcademicYears - fetch sample academic year data
    const loadAcademicYears = async () => {
      try {
        const academicYearList = await getAcademicYears()
        setAcademicYears(academicYearList)
      } catch (error) {
        console.error('Failed to load academic years:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAcademicYears()
  }, [])

  // handleAddAcademicYear - add a new academic year row
  const handleAddAcademicYear = (newAcademicYear: AcademicYear) => {
    setAcademicYears((prev) => [newAcademicYear, ...prev])
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-muted-foreground">Loading academic years...</div>
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
              columns={columns}
              onAddAcademicYear={handleAddAcademicYear}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
