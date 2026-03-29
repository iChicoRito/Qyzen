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
import { type SectionPermissions } from '@/lib/auth/section-permissions'
import { updateSection, type SectionRecord } from '@/lib/supabase/sections'

import { sectionSchema } from '../data/schema'
import { DeleteConfirmationModal } from './delete-confirmation-modal'
import { EditSectionModal } from './edit-section-modal'
import { ViewSectionModal } from './view-section-modal'

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  permissions: SectionPermissions
  onSectionUpdated?: (section: SectionRecord) => void
  onSectionDeleted?: (sectionId: number) => void
}

// DataTableRowActions - render row action menu
export function DataTableRowActions<TData>({
  row,
  permissions,
  onSectionUpdated,
  onSectionDeleted,
}: DataTableRowActionsProps<TData>) {
  // ==================== DATA ====================
  const section = sectionSchema.parse(row.original)
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
            View Section
          </DropdownMenuItem>
          {permissions.canUpdate ? (
            <DropdownMenuItem className="cursor-pointer" onClick={() => setIsEditOpen(true)}>
              Edit Section
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

      <ViewSectionModal
        section={section}
        trigger={null}
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
      />
      <EditSectionModal
        section={section}
        onUpdateSection={updateSection}
        onSectionUpdated={onSectionUpdated}
        trigger={null}
        open={permissions.canUpdate ? isEditOpen : false}
        onOpenChange={setIsEditOpen}
      />
      <DeleteConfirmationModal
        section={section}
        trigger={null}
        open={permissions.canDelete ? isDeleteOpen : false}
        onOpenChange={setIsDeleteOpen}
        onSectionDeleted={onSectionDeleted}
      />
    </>
  )
}
