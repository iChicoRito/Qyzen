'use client'

import type { Row } from '@tanstack/react-table'
import { IconDots } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { academicYearSchema } from '../data/schema'
import { DeleteConfirmationModal } from './delete-confirmation-modal'

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  onDeleteAcademicYear?: (academicYear: { academicYear: string; status: 'active' | 'inactive' }) => Promise<void>
}

// DataTableRowActions - show row actions
export function DataTableRowActions<TData>({
  row,
  onDeleteAcademicYear,
}: DataTableRowActionsProps<TData>) {
  const academicYear = academicYearSchema.parse(row.original)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 cursor-pointer p-0 data-[state=open]:bg-muted"
        >
          <IconDots stroke={2} />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[190px]">
        <DropdownMenuItem className="cursor-pointer">View Academic Year</DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">Edit Academic Year</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DeleteConfirmationModal
          academicYear={academicYear}
          onDeleteAcademicYear={onDeleteAcademicYear}
          trigger={
            <DropdownMenuItem
              onSelect={(event) => event.preventDefault()}
              className="cursor-pointer"
              variant="destructive"
            >
              Delete
              <DropdownMenuShortcut className="text-destructive">Del</DropdownMenuShortcut>
            </DropdownMenuItem>
          }
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
