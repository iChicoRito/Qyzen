'use client'

import type { Table } from '@tanstack/react-table'
import { IconRefresh } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTableViewOptions } from './data-table-view-options'
import { AddAcademicTermModal } from './add-term-modal'

import { semesters, statuses } from '../data/data'
import type { AcademicTerm } from '../data/schema'

interface AcademicYearOption {
  value: string
  label: string
}

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  academicYearOptions: AcademicYearOption[]
  onAddAcademicTerm?: (academicTerm: AcademicTerm) => Promise<void>
}

// DataTableToolbar - filter and add academic term rows
export function DataTableToolbar<TData>({
  table,
  academicYearOptions,
  onAddAcademicTerm,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  // handleStatusChange - update the status filter
  const handleStatusChange = (value: string) => {
    const column = table.getColumn('status')
    if (value === 'all') {
      column?.setFilterValue(undefined)
    } else {
      column?.setFilterValue(value)
    }
  }

  // handleSemesterChange - update the semester filter
  const handleSemesterChange = (value: string) => {
    const column = table.getColumn('semester')
    if (value === 'all') {
      column?.setFilterValue(undefined)
    } else {
      column?.setFilterValue(value)
    }
  }

  const statusFilter = table.getColumn('status')?.getFilterValue() as string | undefined
  const semesterFilter = table.getColumn('semester')?.getFilterValue() as string | undefined

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Select value={semesterFilter || 'all'} onValueChange={handleSemesterChange}>
            <SelectTrigger className="w-full cursor-pointer">
              <SelectValue placeholder="Semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="cursor-pointer">
                All Semesters
              </SelectItem>
              {semesters.map((semester) => (
                <SelectItem key={semester.value} value={semester.value} className="cursor-pointer">
                  {semester.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter || 'all'} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full cursor-pointer">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="cursor-pointer">
                All Status
              </SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status.value} value={status.value} className="cursor-pointer">
                  <div className="flex items-center">
                    {status.icon && <status.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                    {status.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Search academic term"
            value={(table.getColumn('academicTermName')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
              table.getColumn('academicTermName')?.setFilterValue(event.target.value)
            }
            className="w-[200px] cursor-text lg:w-[300px]"
          />
          <Button
            variant="outline"
            onClick={() => table.resetColumnFilters()}
            className="cursor-pointer px-3"
            disabled={!isFiltered}
          >
            <IconRefresh className="h-4 w-4" stroke={2} />
            <span className="hidden lg:block">Reset Filters</span>
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <DataTableViewOptions table={table} />
          <AddAcademicTermModal
            academicYearOptions={academicYearOptions}
            onAddAcademicTerm={onAddAcademicTerm}
          />
        </div>
      </div>
    </div>
  )
}
