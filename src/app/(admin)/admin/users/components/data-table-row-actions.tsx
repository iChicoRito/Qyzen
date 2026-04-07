'use client'

import { useState } from 'react'
import type { Row } from '@tanstack/react-table'
import { IconDots, IconMailForward, IconTrash } from '@tabler/icons-react'
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

import { userSchema } from '../data/schema'
import { DeleteConfirmationModal } from './delete-confirmation-modal'
import { EditUserModal } from './edit-user-modal'
import { ViewUserModal } from './view-user-modal'

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  onDeleteUser: (userId: number) => Promise<void>
  onResendEmail: (userId: number) => Promise<string>
}

// DataTableRowActions - show row actions
export function DataTableRowActions<TData>({
  row,
  onDeleteUser,
  onResendEmail,
}: DataTableRowActionsProps<TData>) {
  const user = userSchema.parse(row.original)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isResending, setIsResending] = useState(false)

  // handleDeleteUser - delete the selected user and close the menu flow
  const handleDeleteUser = async () => {
    try {
      await onDeleteUser(user.id)
      toast.success('User deleted successfully', {
        description: `${user.givenName} ${user.surname} has been removed.`,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete user.')
      throw error
    }
  }

  // handleResendEmail - resend the verification email for the selected user
  const handleResendEmail = async () => {
    try {
      setIsResending(true)
      const message = await onResendEmail(user.id)
      toast.success('Verification email resent', {
        description: message,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to resend verification email.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <>
      <ViewUserModal user={user} open={isViewOpen} onOpenChange={setIsViewOpen} />
      <EditUserModal user={user} open={isEditOpen} onOpenChange={setIsEditOpen} />
      <DeleteConfirmationModal
        user={user}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onDelete={handleDeleteUser}
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
            View User
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onClick={() => setIsEditOpen(true)}>
            Edit User
          </DropdownMenuItem>
          {!user.isEmailVerified && user.hasAuthUser ? (
            <DropdownMenuItem
              className="cursor-pointer"
              disabled={isResending}
              onClick={handleResendEmail}
            >
              <IconMailForward className="mr-2 h-4 w-4" stroke={2} />
              {isResending ? 'Sending...' : 'Resend Email'}
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            variant="destructive"
            onClick={() => setIsDeleteOpen(true)}
          >
            <IconTrash className="mr-2 h-4 w-4" stroke={2} />
            Delete
            <DropdownMenuShortcut className="text-destructive">Del</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
