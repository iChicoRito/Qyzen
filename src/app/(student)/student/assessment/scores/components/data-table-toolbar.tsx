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

import { scoreStatuses } from '../data/data'
import { DataTableViewOptions } from './data-table-view-options'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
}

// getSelectOptions - build unique select options from table rows
function getSelectOptions<TData>(table: Table<TData>, key: 'moduleCode' | 'subjectName' | 'termName') {
  const rows = table.getCoreRowModel().rows
  const values = rows
    .map((row) => String((row.original as Record<string, unknown>)[key] || ''))
    .filter(Boolean)

  return Array.from(new Set(values)).sort((leftValue, rightValue) =>
    leftValue.localeCompare(rightValue)
  )
}

// DataTableToolbar - render student score filters and actions
export function DataTableToolbar<TData>({ table }: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0
  const moduleOptions = getSelectOptions(table, 'moduleCode')
  const subjectOptions = getSelectOptions(table, 'subjectName')
  const termOptions = getSelectOptions(table, 'termName')
  const moduleFilter = table.getColumn('moduleCode')?.getFilterValue() as string | undefined
  const subjectFilter = table.getColumn('subjectName')?.getFilterValue() as string | undefined
  const termFilter = table.getColumn('termName')?.getFilterValue() as string | undefined
  const statusFilter = table.getColumn('status')?.getFilterValue() as string | undefined

  return (
    <div className="min-w-0 space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Select
          value={moduleFilter || 'all'}
          onValueChange={(value) =>
            table.getColumn('moduleCode')?.setFilterValue(value === 'all' ? undefined : value)
          }
        >
          <SelectTrigger className="w-full cursor-pointer">
            <SelectValue placeholder="Module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="cursor-pointer">
              All Modules
            </SelectItem>
            {moduleOptions.map((option) => (
              <SelectItem key={option} value={option} className="cursor-pointer">
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={subjectFilter || 'all'}
          onValueChange={(value) =>
            table.getColumn('subjectName')?.setFilterValue(value === 'all' ? undefined : value)
          }
        >
          <SelectTrigger className="w-full cursor-pointer">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="cursor-pointer">
              All Subjects
            </SelectItem>
            {subjectOptions.map((option) => (
              <SelectItem key={option} value={option} className="cursor-pointer">
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={termFilter || 'all'}
          onValueChange={(value) =>
            table.getColumn('termName')?.setFilterValue(value === 'all' ? undefined : value)
          }
        >
          <SelectTrigger className="w-full cursor-pointer">
            <SelectValue placeholder="Academic Term" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="cursor-pointer">
              All Terms
            </SelectItem>
            {termOptions.map((option) => (
              <SelectItem key={option} value={option} className="cursor-pointer">
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter || 'all'}
          onValueChange={(value) =>
            table.getColumn('status')?.setFilterValue(value === 'all' ? undefined : value)
          }
        >
          <SelectTrigger className="w-full cursor-pointer">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="cursor-pointer">
              All Status
            </SelectItem>
            {scoreStatuses.map((status) => (
              <SelectItem key={status.value} value={status.value} className="cursor-pointer">
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder="Search module or subject"
            value={(table.getColumn('search')?.getFilterValue() as string) ?? ''}
            onChange={(event) => {
              const nextValue = event.target.value
              table.getColumn('search')?.setFilterValue(nextValue || undefined)
            }}
            className="w-full cursor-text sm:flex-1 lg:max-w-[320px]"
          />
          <Button
            variant="outline"
            onClick={() => table.resetColumnFilters()}
            className="w-full cursor-pointer sm:w-auto"
            disabled={!isFiltered}
          >
            <IconRefresh size={16} className="mr-0" />
            Reset Filters
          </Button>
        </div>
        <div className="flex justify-end">
          <DataTableViewOptions table={table} />
        </div>
      </div>
    </div>
  )
}
