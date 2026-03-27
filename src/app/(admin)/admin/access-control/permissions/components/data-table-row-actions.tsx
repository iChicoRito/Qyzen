'use client'

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

  return (
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
        <ViewPermissionsModal
          permission={permission}
          trigger={
            <DropdownMenuItem onSelect={(event) => event.preventDefault()} className="cursor-pointer">
              View Permission
            </DropdownMenuItem>
          }
        />
        <DropdownMenuItem className="cursor-pointer">Edit Permission</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DeleteConfirmationModal
          permission={permission}
          onDeletePermission={onDeletePermission}
          trigger={
            <DropdownMenuItem
              onSelect={(event) => event.preventDefault()}
              className="cursor-pointer"
              variant="destructive"
            >
              Delete
              <DropdownMenuShortcut className="text-destructive">Del</DropdownMenuShortcut>
            </DropdownMenuItem>
          }
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
