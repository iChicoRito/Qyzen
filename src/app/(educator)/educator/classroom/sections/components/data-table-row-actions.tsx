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
import { deleteSection, updateSection, type SectionRecord } from '@/lib/supabase/sections'

import { sectionSchema } from '../data/schema'
import { EditSectionModal } from './edit-section-modal'
import { ViewSectionModal } from './view-section-modal'

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  onSectionUpdated?: (section: SectionRecord) => void
  onSectionDeleted?: (sectionId: number) => void
}

// DataTableRowActions - render row action menu
export function DataTableRowActions<TData>({
  row,
  onSectionUpdated,
  onSectionDeleted,
}: DataTableRowActionsProps<TData>) {
  // ==================== DATA ====================
  const section = sectionSchema.parse(row.original)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)

  // handleDelete - delete current section
  const handleDelete = async () => {
    const isConfirmed = window.confirm(`Delete section "${section.sectionName}"?`)

    if (!isConfirmed) {
      return
    }

    try {
      await deleteSection(section.id)
      onSectionDeleted?.(section.id)
      toast.success('Section deleted successfully.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete section.')
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
            View Section
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onSelect={() => setIsEditOpen(true)}>
            Edit Section
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" variant="destructive" onSelect={handleDelete}>
            Delete
            <DropdownMenuShortcut className="text-destructive">Del</DropdownMenuShortcut>
          </DropdownMenuItem>
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
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </>
  )
}
