'use client'

import { useState } from 'react'
import { IconAlertTriangle } from '@tabler/icons-react'

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
import { Spinner } from '@/components/ui/spinner'

import type { User } from '../data/schema'

interface DeleteConfirmationModalProps {
  user: User
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onDelete?: () => Promise<void>
}

// DeleteConfirmationModal - show delete confirmation
export function DeleteConfirmationModal({
  user,
  trigger,
  open,
  onOpenChange,
  onDelete,
}: DeleteConfirmationModalProps) {
  // ==================== STATE ====================
  const [internalOpen, setInternalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const dialogOpen = open ?? internalOpen
  const setDialogOpen = onOpenChange ?? setInternalOpen

  // handleDeleteClick - run the delete flow and close on success
  const handleDeleteClick = async () => {
    try {
      setIsDeleting(true)
      await onDelete?.()
      setDialogOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent overlayClassName="bg-transparent backdrop-blur-sm" showCloseButton={false} className="rounded-[1rem] sm:max-w-[500px]">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/12 text-destructive">
            <IconAlertTriangle className="h-8 w-8" stroke={2} />
          </div>

          <DialogHeader className="items-center text-center sm:text-center">
            <DialogTitle className="text-center">
              Are you absolutely sure you want to delete?
            </DialogTitle>
            <DialogDescription className="max-w-[34rem] text-center">
              This will permanently delete {user.givenName} {user.surname}. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <div className="grid w-full max-w-[26rem] grid-cols-2 gap-3">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="h-10 w-full cursor-pointer"
                disabled={isDeleting}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteClick}
              className="h-11 w-full cursor-pointer"
              disabled={isDeleting}
            >
              {isDeleting ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
