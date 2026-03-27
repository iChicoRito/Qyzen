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

import { roleSchema } from '../data/schema'
import { DeleteConfirmationModal } from './delete-confirmation-modal'
import { ViewRolesModal } from './view-roles-modal'

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

// DataTableRowActions - show row actions
export function DataTableRowActions<TData>({ row }: DataTableRowActionsProps<TData>) {
  const role = roleSchema.parse(row.original)

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
      <DropdownMenuContent align="end" className="w-[190px]">
        <ViewRolesModal
          role={role}
          trigger={<DropdownMenuItem onSelect={(event) => event.preventDefault()} className="cursor-pointer">View Role</DropdownMenuItem>}
        />
        <DropdownMenuItem className="cursor-pointer">Edit Role</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DeleteConfirmationModal
          role={role}
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
