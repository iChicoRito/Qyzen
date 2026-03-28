'use client'

import { useState } from 'react'
import type { Row } from '@tanstack/react-table'
import { IconDotsVertical } from '@tabler/icons-react'
import { toast } from 'sonner'

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
import { deleteSubject, updateSubject, type SubjectRecord } from '@/lib/supabase/subjects'

import { subjectSchema } from '../data/schema'
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

  // handleDelete - delete current subject
  const handleDelete = async () => {
    const isConfirmed = window.confirm(`Delete subject "${subject.subjectName}"?`)

    if (!isConfirmed) {
      return
    }

    try {
      await deleteSubject(subject.rowIds)
      onSubjectDeleted?.(subject.rowIds)
      toast.success('Subject deleted successfully.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete subject.')
    }
  }

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
          <DropdownMenuItem className="cursor-pointer" onSelect={() => setIsViewOpen(true)}>
            View Subject
          </DropdownMenuItem>
          {permissions.canUpdate ? (
            <DropdownMenuItem className="cursor-pointer" onSelect={() => setIsEditOpen(true)}>
              Edit Subject
            </DropdownMenuItem>
          ) : null}
          {permissions.canDelete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" variant="destructive" onSelect={handleDelete}>
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
    </>
  )
}
