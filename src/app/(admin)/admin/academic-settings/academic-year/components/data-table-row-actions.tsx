'use client'

import { useState } from 'react'
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
}

// DataTableRowActions - show row actions
export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const academicYear = academicYearSchema.parse(row.original)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  return (
    <>
      <DeleteConfirmationModal
        academicYear={academicYear}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
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
        <DropdownMenuItem
          className="cursor-pointer"
          variant="destructive"
          onClick={() => setIsDeleteOpen(true)}
        >
          Delete
          <DropdownMenuShortcut className="text-destructive">Del</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </>
  )
}
