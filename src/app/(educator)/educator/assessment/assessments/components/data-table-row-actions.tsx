'use client'

import { useState } from 'react'
import type { Row } from '@tanstack/react-table'
import { IconDotsVertical } from '@tabler/icons-react'

import { type AssessmentPermissions } from '@/lib/auth/assessment-permissions'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { updateAssessment, type AssessmentRecord } from '@/lib/supabase/assessments'

import { assessmentSchema } from '../data/schema'
import { DeleteConfirmationModal } from './delete-confirmation-modal'
import { EditAssessmentsModal } from './edit-assessments-modal'
import { ViewAssessmentsModal } from './view-assessments-modal'

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  permissions: AssessmentPermissions
  onAssessmentUpdated?: (assessment: AssessmentRecord) => void
  onAssessmentDeleted?: (assessmentId: number) => void
}

// DataTableRowActions - render assessment row actions
export function DataTableRowActions<TData>({
  row,
  permissions,
  onAssessmentUpdated,
  onAssessmentDeleted,
}: DataTableRowActionsProps<TData>) {
  const assessment = assessmentSchema.parse(row.original)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

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
        <DropdownMenuContent align="end" className="w-[170px]">
          <DropdownMenuItem className="cursor-pointer" onClick={() => setIsViewOpen(true)}>
            View Assessment
          </DropdownMenuItem>
          {permissions.canUpdate ? (
            <DropdownMenuItem className="cursor-pointer" onClick={() => setIsEditOpen(true)}>
              Edit Assessment
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

      <ViewAssessmentsModal
        assessment={assessment}
        trigger={null}
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
      />
      <EditAssessmentsModal
        assessment={assessment}
        onUpdateAssessment={updateAssessment}
        onAssessmentUpdated={onAssessmentUpdated}
        trigger={null}
        open={permissions.canUpdate ? isEditOpen : false}
        onOpenChange={setIsEditOpen}
      />
      <DeleteConfirmationModal
        assessment={assessment}
        trigger={null}
        open={permissions.canDelete ? isDeleteOpen : false}
        onOpenChange={setIsDeleteOpen}
        onAssessmentDeleted={onAssessmentDeleted}
      />
    </>
  )
}

