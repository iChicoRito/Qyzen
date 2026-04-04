'use client'

import type { Table } from '@tanstack/react-table'
import { IconRefresh } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type BulkCreateEnrollmentRow, type CreateEnrollmentInput } from '@/lib/supabase/enrollments'

import { AddStudentModal } from './add-student-modal'
import { DataTableViewOptions } from './data-table-view-options'
import { UploadEnrollmentsFileModal } from './upload-enrollments-file-modal'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  onAddEnrollment?: (input: CreateEnrollmentInput) => Promise<void>
  onUploadEnrollments?: (rows: BulkCreateEnrollmentRow[]) => Promise<void>
}

// DataTableToolbar - filter and create enrollment rows
export function DataTableToolbar<TData>({
  table,
  onAddEnrollment,
  onUploadEnrollments,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0
  const sectionFilter = table.getColumn('sectionName')?.getFilterValue() as string | undefined
  const subjectFilter = table.getColumn('subjectName')?.getFilterValue() as string | undefined
  const sectionOptions = Array.from(table.getColumn('sectionName')?.getFacetedUniqueValues().keys() || [])
    .map((value) => String(value))
    .sort((firstValue, secondValue) => firstValue.localeCompare(secondValue))
  const subjectOptions = Array.from(table.getColumn('subjectName')?.getFacetedUniqueValues().keys() || [])
    .map((value) => String(value))
    .sort((firstValue, secondValue) => firstValue.localeCompare(secondValue))

  const handleSubjectChange = (value: string) => {
    const column = table.getColumn('subjectName')
    if (value === 'all') {
      column?.setFilterValue(undefined)
      return
    }
    column?.setFilterValue(value)
  }

  const handleSectionChange = (value: string) => {
    const column = table.getColumn('sectionName')
    if (value === 'all') {
      column?.setFilterValue(undefined)
      return
    }
    column?.setFilterValue(value)
  }

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Input
            placeholder="Search student"
            value={(table.getColumn('studentName')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('studentName')?.setFilterValue(event.target.value)}
            className="w-full cursor-text sm:flex-1 lg:max-w-[300px]"
          />
          <Select value={sectionFilter || 'all'} onValueChange={handleSectionChange}>
            <SelectTrigger className="w-full cursor-pointer sm:w-[180px]">
              <SelectValue placeholder="Section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="cursor-pointer">All Sections</SelectItem>
              {sectionOptions.map((sectionName) => (
                <SelectItem key={sectionName} value={sectionName} className="cursor-pointer">
                  {sectionName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={subjectFilter || 'all'} onValueChange={handleSubjectChange}>
            <SelectTrigger className="w-full cursor-pointer sm:w-[180px]">
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="cursor-pointer">All Subjects</SelectItem>
              {subjectOptions.map((subjectName) => (
                <SelectItem key={subjectName} value={subjectName} className="cursor-pointer">
                  {subjectName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => table.resetColumnFilters()} className="w-full cursor-pointer px-3 sm:w-auto" disabled={!isFiltered}>
            <IconRefresh size={18} />
            <span className="hidden lg:block">Reset Filters</span>
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <DataTableViewOptions table={table} />
          <UploadEnrollmentsFileModal onUploadEnrollments={onUploadEnrollments} />
          <AddStudentModal onAddEnrollment={onAddEnrollment} />
        </div>
      </div>
    </div>
  )
}
