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

import { roleSchema } from '../data/schema'
import { DeleteConfirmationModal } from './delete-confirmation-modal'
import { EditRoleModal } from './edit-role-modal'
import { ViewRolesModal } from './view-roles-modal'

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  onRoleUpdated?: (currentRoleName: string, updatedRole: {
    roleName: string
    description: string
    status: 'active' | 'inactive'
    isSystem: boolean
  }) => void
  onDeleteRole?: (role: {
    roleName: string
    description: string
    status: 'active' | 'inactive'
    isSystem: boolean
  }) => Promise<void>
}

// DataTableRowActions - show row actions
export function DataTableRowActions<TData>({
  row,
  onRoleUpdated,
  onDeleteRole,
}: DataTableRowActionsProps<TData>) {
  const role = roleSchema.parse(row.original)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  return (
    <>
      <ViewRolesModal role={role} open={isViewOpen} onOpenChange={setIsViewOpen} />
      <EditRoleModal
        role={role}
        onRoleUpdated={onRoleUpdated}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
      <DeleteConfirmationModal
        role={role}
        onDeleteRole={onDeleteRole}
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
        <DropdownMenuItem className="cursor-pointer" onClick={() => setIsViewOpen(true)}>
          View Role
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={() => setIsEditOpen(true)}>
          Edit Role
        </DropdownMenuItem>
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
