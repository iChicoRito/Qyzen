'use client'

import { useState } from 'react'
import type { Row } from '@tanstack/react-table'
import { IconDotsVertical } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type SubjectPermissions } from '@/lib/auth/subject-permissions'
import { updateSubject, type SubjectRecord } from '@/lib/supabase/subjects'

import { subjectSchema } from '../data/schema'
import { DeleteConfirmationModal } from './delete-confirmation-modal'
import { EditSubjectModal } from './edit-subject-modal'
import { ViewSubjectModal } from './view-subject-modal'

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  permissions: SubjectPermissions
  onSubjectUpdated?: (previousRowIds: number[], subject: SubjectRecord) => void
  onSubjectDeleted?: (rowIds: number[]) => void
}

// DataTableRowActions - render row action menu
export function DataTableRowActions<TData>({
  row,
  permissions,
  onSubjectUpdated,
  onSubjectDeleted,
}: DataTableRowActionsProps<TData>) {
  // ==================== DATA ====================
  const subject = subjectSchema.parse(row.original)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  // ==================== RENDER ====================
  return (
    <>
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
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem className="cursor-pointer" onClick={() => setIsViewOpen(true)}>
            View Subject
          </DropdownMenuItem>
          {permissions.canUpdate ? (
            <DropdownMenuItem className="cursor-pointer" onClick={() => setIsEditOpen(true)}>
              Edit Subject
            </DropdownMenuItem>
          ) : null}
          {permissions.canDelete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                variant="destructive"
                onClick={() => setIsDeleteOpen(true)}
              >
                Delete
                <DropdownMenuShortcut className="text-destructive">Del</DropdownMenuShortcut>
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <ViewSubjectModal
        subject={subject}
        trigger={null}
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
      />
      <EditSubjectModal
        subject={subject}
        onUpdateSubject={updateSubject}
        onSubjectUpdated={onSubjectUpdated}
        trigger={null}
        open={permissions.canUpdate ? isEditOpen : false}
        onOpenChange={setIsEditOpen}
      />
      <DeleteConfirmationModal
        subject={subject}
        trigger={null}
        open={permissions.canDelete ? isDeleteOpen : false}
        onOpenChange={setIsDeleteOpen}
        onSubjectDeleted={onSubjectDeleted}
      />
    </>
  )
}
