"use client"

import { useState } from "react"
import type { Row } from "@tanstack/react-table"
import { IconDots } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { userSchema } from "../data/schema"
import { DeleteConfirmationModal } from "./delete-confirmation-modal"
import { EditUserModal } from "./edit-user-modal"
import { ViewUserModal } from "./view-user-modal"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

// DataTableRowActions - show row actions
export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const user = userSchema.parse(row.original)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  return (
    <>
      <ViewUserModal user={user} open={isViewOpen} onOpenChange={setIsViewOpen} />
      <EditUserModal user={user} open={isEditOpen} onOpenChange={setIsEditOpen} />
      <DeleteConfirmationModal user={user} open={isDeleteOpen} onOpenChange={setIsDeleteOpen} />
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
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem className="cursor-pointer" onClick={() => setIsViewOpen(true)}>
          View User
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={() => setIsEditOpen(true)}>
          Edit User
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
