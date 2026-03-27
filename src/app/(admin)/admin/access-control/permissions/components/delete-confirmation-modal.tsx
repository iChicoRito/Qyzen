'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import type { Permission } from '../data/schema'

interface DeleteConfirmationModalProps {
  permission: Permission
  onDeletePermission?: (permission: Permission) => Promise<void>
  trigger: React.ReactNode
}

// DeleteConfirmationModal - show delete confirmation
export function DeleteConfirmationModal({
  permission,
  onDeletePermission,
  trigger,
}: DeleteConfirmationModalProps) {
  // ==================== STATE ====================
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // handleDeleteClick - delete permission row
  const handleDeleteClick = async () => {
    try {
      setIsDeleting(true)
      await onDeletePermission?.(permission)
      toast.success('Permission deleted', {
        description: `${permission.permissionName} was removed successfully.`,
      })
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete permission.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Permission</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {permission.permissionName}? This action is static for
            now.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="cursor-pointer">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeleteClick}
            className="cursor-pointer"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
