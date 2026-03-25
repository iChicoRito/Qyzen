'use client'

import { useEffect, useState } from 'react'
import { z } from 'zod'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { columns } from './components/columns'
import { DataTable } from './components/data-table'
import { academicTermSchema, type AcademicTerm } from './data/schema'
import academicTermsData from './data/data.json'

// getAcademicTerms - load static academic term data
async function getAcademicTerms() {
  return z.array(academicTermSchema).parse(academicTermsData)
}

// AcademicTermPage - manage academic term records
export default function AcademicTermPage() {
  // ==================== STATE ====================
  const [academicTerms, setAcademicTerms] = useState<AcademicTerm[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // loadAcademicTerms - fetch sample academic term data
    const loadAcademicTerms = async () => {
      try {
        const academicTermList = await getAcademicTerms()
        setAcademicTerms(academicTermList)
      } catch (error) {
        console.error('Failed to load academic terms:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAcademicTerms()
  }, [])

  // handleAddAcademicTerm - add a new academic term row
  const handleAddAcademicTerm = (newAcademicTerm: AcademicTerm) => {
    setAcademicTerms((prev) => [newAcademicTerm, ...prev])
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-muted-foreground">Loading academic terms...</div>
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
              columns={columns}
              onAddAcademicTerm={handleAddAcademicTerm}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
