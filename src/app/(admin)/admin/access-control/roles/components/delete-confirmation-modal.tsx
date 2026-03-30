'use client'

import { useState } from 'react'
import { AlertTriangleIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import type { Role } from '../data/schema'

interface DeleteConfirmationModalProps {
  role: Role
  onDeleteRole?: (role: Role) => Promise<void>
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

// DeleteConfirmationModal - show delete confirmation
export function DeleteConfirmationModal({
  role,
  onDeleteRole,
  trigger,
  open,
  onOpenChange,
}: DeleteConfirmationModalProps) {
  // ==================== STATE ====================
  const [internalOpen, setInternalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const dialogOpen = open ?? internalOpen
  const setDialogOpen = onOpenChange ?? setInternalOpen

  // handleDeleteClick - delete role row
  const handleDeleteClick = async () => {
    try {
      setIsDeleting(true)
      await onDeleteRole?.(role)
      toast.success('Role deleted', {
        description: `${role.roleName} was removed successfully.`,
      })
      setDialogOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete role.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent showCloseButton={false} className="rounded-[1rem] sm:max-w-[500px]">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/12 text-destructive">
            <AlertTriangleIcon className="h-8 w-8" />
          </div>

          <DialogHeader className="items-center text-center sm:text-center">
            <DialogTitle className="text-center">
              Are you absolutely sure you want to delete?
            </DialogTitle>
            <DialogDescription className="max-w-[34rem] text-center">
              This will permanently delete the {role.roleName} role. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="grid w-full max-w-[26rem] grid-cols-2 gap-3">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="h-10 w-full cursor-pointer">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteClick}
              className="h-10 w-full cursor-pointer"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
