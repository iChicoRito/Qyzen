'use client'

import type { Row } from '@tanstack/react-table'
import { IconDotsVertical, IconEye } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { educatorRealtimeMonitoringRowSchema } from '../data/schema'

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  onMonitorStudents: (moduleRowId: number) => void
}

// DataTableRowActions - render row actions for one monitored module
export function DataTableRowActions<TData>({
  row,
  onMonitorStudents,
}: DataTableRowActionsProps<TData>) {
  const monitoringRow = educatorRealtimeMonitoringRowSchema.parse(row.original)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 cursor-pointer p-0 data-[state=open]:bg-muted"
        >
          <IconDotsVertical size={18} />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[190px]">
        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={() => onMonitorStudents(monitoringRow.moduleRowId)}
        >
          <IconEye size={16} className="mr-0" />
          Monitor Students
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
