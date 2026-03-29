'use client'

import type { Table } from '@tanstack/react-table'
import { IconRefresh } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type CreateEnrollmentInput } from '@/lib/supabase/enrollments'

import { AddStudentModal } from './add-student-modal'
import { DataTableViewOptions } from './data-table-view-options'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  onAddEnrollment?: (input: CreateEnrollmentInput) => Promise<void>
}

// DataTableToolbar - filter and create enrollment rows
export function DataTableToolbar<TData>({ table, onAddEnrollment }: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0
  const statusFilter = table.getColumn('status')?.getFilterValue() as string[] | undefined

  const handleStatusChange = (value: string) => {
    const column = table.getColumn('status')
    if (value === 'all') {
      column?.setFilterValue(undefined)
      return
    }
    column?.setFilterValue([value])
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-1 items-center gap-2">
          <Input
            placeholder="Search student"
            value={(table.getColumn('studentName')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('studentName')?.setFilterValue(event.target.value)}
            className="w-[200px] cursor-text lg:w-[300px]"
          />
          <Input
            placeholder="Search section"
            value={(table.getColumn('sectionName')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('sectionName')?.setFilterValue(event.target.value)}
            className="w-[180px] cursor-text"
          />
          <Select value={statusFilter?.[0] || 'all'} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px] cursor-pointer">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="cursor-pointer">All Status</SelectItem>
              <SelectItem value="active" className="cursor-pointer">Active</SelectItem>
              <SelectItem value="inactive" className="cursor-pointer">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => table.resetColumnFilters()} className="cursor-pointer px-3" disabled={!isFiltered}>
            <IconRefresh size={18} />
            <span className="hidden lg:block">Reset Filters</span>
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <DataTableViewOptions table={table} />
          <AddStudentModal onAddEnrollment={onAddEnrollment} />
        </div>
      </div>
    </div>
  )
}
