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
import { type SubjectPermissions } from '@/lib/auth/subject-permissions'
import { type SubjectCreateInput } from '@/lib/supabase/subjects'

import { AddSubjectModal } from './add-subject-modal'
import { DataTableViewOptions } from './data-table-view-options'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  onAddSubject?: (subject: SubjectCreateInput) => Promise<void>
  permissions: SubjectPermissions
}

// DataTableToolbar - filter and create subject rows
export function DataTableToolbar<TData>({
  table,
  onAddSubject,
  permissions,
}: DataTableToolbarProps<TData>) {
  // ==================== FILTER STATE ====================
  const isFiltered = table.getState().columnFilters.length > 0
  const statusFilter = table.getColumn('status')?.getFilterValue() as string | undefined

  // handleStatusChange - update table status filter
  const handleStatusChange = (value: string) => {
    const column = table.getColumn('status')

    if (value === 'all') {
      column?.setFilterValue(undefined)
      return
    }

    column?.setFilterValue([value])
  }

  // ==================== RENDER ====================
  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Input
            placeholder="Search subject"
            value={(table.getColumn('subjectName')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('subjectName')?.setFilterValue(event.target.value)}
            className="w-full cursor-text sm:flex-1 lg:max-w-[300px]"
          />
          <Select value={statusFilter || 'all'} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full cursor-pointer sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="cursor-pointer">
                All Status
              </SelectItem>
              <SelectItem value="active" className="cursor-pointer">
                Active
              </SelectItem>
              <SelectItem value="inactive" className="cursor-pointer">
                Inactive
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => table.resetColumnFilters()}
            className="w-full cursor-pointer px-3 sm:w-auto"
            disabled={!isFiltered}
          >
            <IconRefresh size={18} />
            <span className="hidden lg:block">Reset Filters</span>
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <DataTableViewOptions table={table} />
          {permissions.canCreate ? <AddSubjectModal onAddSubject={onAddSubject} /> : null}
        </div>
      </div>
    </div>
  )
}
