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
import { AddPermissionsModal } from './add-permissions-modal'
import { DataTableViewOptions } from './data-table-view-options'

import { statuses } from '../data/data'
import type { Permission } from '../data/schema'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  onAddPermissions?: (permissions: Permission[]) => Promise<void>
}

// DataTableToolbar - filter and add permission rows
export function DataTableToolbar<TData>({
  table,
  onAddPermissions,
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

  // handleResourceChange - update the resource filter
  const handleResourceChange = (value: string) => {
    const column = table.getColumn('resource')
    if (value === 'all') {
      column?.setFilterValue(undefined)
    } else {
      column?.setFilterValue(value)
    }
  }

  const statusFilter = table.getColumn('status')?.getFilterValue() as string | undefined
  const resourceFilter = table.getColumn('resource')?.getFilterValue() as string | undefined

  return (
    <div className="min-w-0 space-y-4">
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Select value={resourceFilter || 'all'} onValueChange={handleResourceChange}>
            <SelectTrigger className="w-full cursor-pointer">
              <SelectValue placeholder="Resource" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="cursor-pointer">
                All Resources
              </SelectItem>
              <SelectItem value="users" className="cursor-pointer">
                users
              </SelectItem>
              <SelectItem value="roles" className="cursor-pointer">
                roles
              </SelectItem>
              <SelectItem value="academic_settings" className="cursor-pointer">
                academic_settings
              </SelectItem>
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
                    {status.icon && <status.icon className="mr-0 h-4 w-4 text-muted-foreground" />}
                    {status.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder="Search permission name"
            value={(table.getColumn('permissionName')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
              table.getColumn('permissionName')?.setFilterValue(event.target.value)
            }
            className="w-full cursor-text sm:flex-1 lg:max-w-[300px]"
          />
          <Button
            variant="outline"
            onClick={() => table.resetColumnFilters()}
            className="w-full cursor-pointer px-3 sm:w-auto"
            disabled={!isFiltered}
          >
            <IconRefresh className="h-4 w-4" stroke={2} />
            <span className="hidden lg:block">Reset Filters</span>
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <DataTableViewOptions table={table} />
          <AddPermissionsModal onAddPermissions={onAddPermissions} />
        </div>
      </div>
    </div>
  )
}
