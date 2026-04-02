'use client'

import type { Table } from '@tanstack/react-table'
import { IconLoader2 as Loader2, IconRefresh } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { monitoringStatusOptions } from '../data/data'
import { DataTableViewOptions } from './data-table-view-options'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  onRefresh: () => void
  isRefreshing: boolean
}

// getSelectOptions - build unique select options from table rows
function getSelectOptions<TData>(
  table: Table<TData>,
  key: 'moduleCode' | 'subjectName' | 'sectionName'
) {
  const rows = table.getCoreRowModel().rows
  const values = rows
    .map((row) => String((row.original as Record<string, unknown>)[key] || ''))
    .filter(Boolean)

  return Array.from(new Set(values)).sort((leftValue, rightValue) =>
    leftValue.localeCompare(rightValue)
  )
}

// DataTableToolbar - render monitoring filters and actions
export function DataTableToolbar<TData>({
  table,
  onRefresh,
  isRefreshing,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0
  const moduleOptions = getSelectOptions(table, 'moduleCode')
  const subjectOptions = getSelectOptions(table, 'subjectName')
  const sectionOptions = getSelectOptions(table, 'sectionName')
  const moduleFilter = table.getColumn('moduleCode')?.getFilterValue() as string | undefined
  const subjectFilter = table.getColumn('subjectName')?.getFilterValue() as string | undefined
  const sectionFilter = table.getColumn('sectionName')?.getFilterValue() as string | undefined
  const assessmentFilter = table.getColumn('rowAssessmentStatus')?.getFilterValue() as string | undefined
  const presenceFilter = table.getColumn('rowPresenceStatus')?.getFilterValue() as string | undefined

  return (
    <div className="min-w-0 space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
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
          value={sectionFilter || 'all'}
          onValueChange={(value) =>
            table.getColumn('sectionName')?.setFilterValue(value === 'all' ? undefined : value)
          }
        >
          <SelectTrigger className="w-full cursor-pointer">
            <SelectValue placeholder="Section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="cursor-pointer">
              All Sections
            </SelectItem>
            {sectionOptions.map((option) => (
              <SelectItem key={option} value={option} className="cursor-pointer">
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={assessmentFilter || 'all'}
          onValueChange={(value) =>
            table.getColumn('rowAssessmentStatus')?.setFilterValue(value === 'all' ? undefined : value)
          }
        >
          <SelectTrigger className="w-full cursor-pointer">
            <SelectValue placeholder="Assessment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="cursor-pointer">
              All Assessment
            </SelectItem>
            <SelectItem value="NOT_STARTED" className="cursor-pointer">
              Not Started
            </SelectItem>
            {monitoringStatusOptions.map((status) => (
              <SelectItem
                key={status.value}
                value={status.value}
                className="cursor-pointer"
                disabled={status.value === 'ONLINE' || status.value === 'OFFLINE'}
              >
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={presenceFilter || 'all'}
          onValueChange={(value) =>
            table.getColumn('rowPresenceStatus')?.setFilterValue(value === 'all' ? undefined : value)
          }
        >
          <SelectTrigger className="w-full cursor-pointer">
            <SelectValue placeholder="Presence" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="cursor-pointer">
              All Presence
            </SelectItem>
            <SelectItem value="ONLINE" className="cursor-pointer">
              Online
            </SelectItem>
            <SelectItem value="OFFLINE" className="cursor-pointer">
              Offline
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder="Search module, subject, or section"
            value={(table.getColumn('search')?.getFilterValue() as string) ?? ''}
            onChange={(event) => {
              const nextValue = event.target.value
              table.getColumn('search')?.setFilterValue(nextValue || undefined)
            }}
            className="w-full cursor-text sm:flex-1 lg:max-w-[320px]"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => table.resetColumnFilters()}
            className="w-full cursor-pointer sm:w-auto"
            disabled={!isFiltered}
          >
            <IconRefresh size={16} className="mr-0" />
            Reset Filters
          </Button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onRefresh}
            className="w-full cursor-pointer sm:w-auto"
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <Loader2 size={18} className="mr-0 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <IconRefresh size={16} className="mr-0" />
                Refresh
              </>
            )}
          </Button>
          <DataTableViewOptions table={table} />
        </div>
      </div>
    </div>
  )
}
