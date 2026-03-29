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

import { permissionSchema } from '../data/schema'
import { DeleteConfirmationModal } from './delete-confirmation-modal'
import { ViewPermissionsModal } from './view-permissions-modal'

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  onDeletePermission?: (permission: {
    permissionName: string
    description: string
    resource: string
    action: string
    module: string
    permissionString: string
    status: 'active' | 'inactive'
  }) => Promise<void>
}

// DataTableRowActions - show row actions
export function DataTableRowActions<TData>({
  row,
  onDeletePermission,
}: DataTableRowActionsProps<TData>) {
  const permission = permissionSchema.parse(row.original)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  return (
    <>
      <ViewPermissionsModal
        permission={permission}
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
      />
      <DeleteConfirmationModal
        permission={permission}
        onDeletePermission={onDeletePermission}
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
      <DropdownMenuContent align="end" className="w-[210px]">
        <DropdownMenuItem className="cursor-pointer" onClick={() => setIsViewOpen(true)}>
          View Permission
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">Edit Permission</DropdownMenuItem>
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
