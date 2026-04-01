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
import { type ModulePermissions } from '@/lib/auth/module-permissions'
import { type ModuleCreateInput } from '@/lib/supabase/modules'

import { moduleStatuses } from '../data/data'
import { AddModulesModal } from './add-modules-modal'
import { DataTableViewOptions } from './data-table-view-options'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  onAddModules?: (input: ModuleCreateInput) => Promise<void>
  permissions: ModulePermissions
}

// DataTableToolbar - filter and create module rows
export function DataTableToolbar<TData>({
  table,
  onAddModules,
  permissions,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0
  const statusFilter = table.getColumn('status')?.getFilterValue() as string[] | undefined
  const termFilter = table.getColumn('termName')?.getFilterValue() as string[] | undefined
  const termOptions = Array.from(
    new Set(
      table
        .getCoreRowModel()
        .rows
        .map((row) => String(row.getValue('termName')))
        .filter(Boolean)
    )
  ).sort((left, right) => left.localeCompare(right))

  // handleStatusChange - update table status filter
  const handleStatusChange = (value: string) => {
    const column = table.getColumn('status')

    if (value === 'all') {
      column?.setFilterValue(undefined)
      return
    }

    column?.setFilterValue([value])
  }

  // handleTermChange - update table term filter
  const handleTermChange = (value: string) => {
    const column = table.getColumn('termName')

    if (value === 'all') {
      column?.setFilterValue(undefined)
      return
    }

    column?.setFilterValue([value])
  }

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Input
            placeholder="Search module code"
            value={(table.getColumn('moduleCode')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('moduleCode')?.setFilterValue(event.target.value)}
            className="w-full cursor-text sm:flex-1 lg:max-w-[300px]"
          />
          <Select value={statusFilter?.[0] || 'all'} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full cursor-pointer sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="cursor-pointer">
                All Status
              </SelectItem>
              {moduleStatuses.map((status) => (
                <SelectItem key={status.value} value={status.value} className="cursor-pointer">
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={termFilter?.[0] || 'all'}
            onValueChange={handleTermChange}
          >
            <SelectTrigger className="w-full cursor-pointer sm:w-[180px]">
              <SelectValue placeholder="Term" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="cursor-pointer">
                All Terms
              </SelectItem>
              {termOptions.map((term) => (
                <SelectItem key={term} value={term} className="cursor-pointer">
                  {term}
                </SelectItem>
              ))}
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
          {permissions.canCreate ? <AddModulesModal onAddModules={onAddModules} /> : null}
        </div>
      </div>
    </div>
  )
}
