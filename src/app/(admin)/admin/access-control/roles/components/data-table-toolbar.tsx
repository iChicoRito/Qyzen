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
import { AddRolesModal } from './add-roles-modal'
import { DataTableViewOptions } from './data-table-view-options'

import { statuses, systemRoleOptions } from '../data/data'
import type { Role } from '../data/schema'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  onAddRole?: (role: Role) => Promise<void>
}

// DataTableToolbar - filter and add role rows
export function DataTableToolbar<TData>({ table, onAddRole }: DataTableToolbarProps<TData>) {
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

  // handleSystemRoleChange - update the system role filter
  const handleSystemRoleChange = (value: string) => {
    const column = table.getColumn('isSystem')
    if (value === 'all') {
      column?.setFilterValue(undefined)
    } else {
      column?.setFilterValue(value)
    }
  }

  const statusFilter = table.getColumn('status')?.getFilterValue() as string | undefined
  const systemRoleFilter = table.getColumn('isSystem')?.getFilterValue() as string | undefined

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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

          <Select value={systemRoleFilter || 'all'} onValueChange={handleSystemRoleChange}>
            <SelectTrigger className="w-full cursor-pointer">
              <SelectValue placeholder="System Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="cursor-pointer">
                All Roles
              </SelectItem>
              {systemRoleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Search role name"
            value={(table.getColumn('roleName')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('roleName')?.setFilterValue(event.target.value)}
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
          <AddRolesModal onAddRole={onAddRole} />
        </div>
      </div>
    </div>
  )
}
