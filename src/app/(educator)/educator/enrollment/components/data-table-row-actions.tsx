'use client'

import { useState } from 'react'
import type { Row } from '@tanstack/react-table'
import { IconDotsVertical } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

import { enrollmentSchema, type Enrollment } from '../data/schema'
import { DeleteConfirmationModal } from './delete-confirmation-modal'
import { ViewEnrollmentModal } from './view-enrollment-modal'

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  onEnrollmentUpdated?: (enrollment: Enrollment) => void
  onEnrollmentDeleted?: (id: number) => void
}

// DataTableRowActions - render row action menu
export function DataTableRowActions<TData>({ row, onEnrollmentUpdated, onEnrollmentDeleted }: DataTableRowActionsProps<TData>) {
  const enrollment = enrollmentSchema.parse(row.original)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex h-8 w-8 cursor-pointer p-0 data-[state=open]:bg-muted">
            <IconDotsVertical size={18} />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[170px]">
          <DropdownMenuItem className="cursor-pointer" onClick={() => setIsViewOpen(true)}>View Enrollment</DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" variant="destructive" onClick={() => setIsDeleteOpen(true)}>
            Un-enroll
            <DropdownMenuShortcut className="text-destructive">Del</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ViewEnrollmentModal enrollment={enrollment} open={isViewOpen} onOpenChange={setIsViewOpen} />
      <DeleteConfirmationModal enrollment={enrollment} open={isDeleteOpen} onOpenChange={setIsDeleteOpen} onEnrollmentDeleted={onEnrollmentDeleted} />
    </>
  )
}
