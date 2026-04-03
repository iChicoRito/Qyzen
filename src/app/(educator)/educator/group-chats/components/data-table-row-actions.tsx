'use client'

import { useState } from 'react'
import Link from 'next/link'
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

import { educatorManagedGroupChatSchema } from '../data/schema'
import { DeleteConfirmationModal } from './delete-confirmation-modal'
import { ViewGroupChatModal } from './view-groupchat-modal'

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  onGroupChatDeleted?: (groupChatId: number) => void
}

// DataTableRowActions - render row actions for educator group chat management
export function DataTableRowActions<TData>({
  row,
  onGroupChatDeleted,
}: DataTableRowActionsProps<TData>) {
  const groupChat = educatorManagedGroupChatSchema.parse(row.original)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="flex h-8 w-8 cursor-pointer p-0 data-[state=open]:bg-muted"
          >
            <IconDotsVertical size={18} />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/educator/group-chats">Open Live Chat</Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onClick={() => setIsViewOpen(true)}>
            View Group Chat
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

      <ViewGroupChatModal
        groupChat={groupChat}
        trigger={null}
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
      />
      <DeleteConfirmationModal
        groupChat={groupChat}
        trigger={null}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onGroupChatDeleted={onGroupChatDeleted}
      />
    </>
  )
}
