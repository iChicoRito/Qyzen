'use client'

import { useState } from 'react'
import type { Row } from '@tanstack/react-table'
import { IconDotsVertical } from '@tabler/icons-react'

import { type ModulePermissions } from '@/lib/auth/module-permissions'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { updateModule, type ModuleRecord } from '@/lib/supabase/modules'

import { moduleSchema } from '../data/schema'
import { DeleteConfirmationModal } from './delete-confirmation-modal'
import { EditModulesModal } from './edit-modules-modal'
import { ViewModulesModal } from './view-modules-modal'

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  permissions: ModulePermissions
  onModuleUpdated?: (module: ModuleRecord) => void
  onModuleDeleted?: (moduleId: number) => void
}

// DataTableRowActions - render module row actions
export function DataTableRowActions<TData>({
  row,
  permissions,
  onModuleUpdated,
  onModuleDeleted,
}: DataTableRowActionsProps<TData>) {
  const module = moduleSchema.parse(row.original)
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
            View Module
          </DropdownMenuItem>
          {permissions.canUpdate ? (
            <DropdownMenuItem className="cursor-pointer" onClick={() => setIsEditOpen(true)}>
              Edit Module
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

      <ViewModulesModal
        module={module}
        trigger={null}
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
      />
      <EditModulesModal
        module={module}
        onUpdateModule={updateModule}
        onModuleUpdated={onModuleUpdated}
        trigger={null}
        open={permissions.canUpdate ? isEditOpen : false}
        onOpenChange={setIsEditOpen}
      />
      <DeleteConfirmationModal
        module={module}
        trigger={null}
        open={permissions.canDelete ? isDeleteOpen : false}
        onOpenChange={setIsDeleteOpen}
        onModuleDeleted={onModuleDeleted}
      />
    </>
  )
}
