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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-1 items-center gap-2">
          <Input
            placeholder="Search module code"
            value={(table.getColumn('moduleCode')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('moduleCode')?.setFilterValue(event.target.value)}
            className="w-[200px] cursor-text lg:w-[300px]"
          />
          <Select value={statusFilter?.[0] || 'all'} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px] cursor-pointer">
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
            <SelectTrigger className="w-[180px] cursor-pointer">
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
            className="cursor-pointer px-3"
            disabled={!isFiltered}
          >
            <IconRefresh size={18} />
            <span className="hidden lg:block">Reset Filters</span>
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <DataTableViewOptions table={table} />
          {permissions.canCreate ? <AddModulesModal onAddModules={onAddModules} /> : null}
        </div>
      </div>
    </div>
  )
}
