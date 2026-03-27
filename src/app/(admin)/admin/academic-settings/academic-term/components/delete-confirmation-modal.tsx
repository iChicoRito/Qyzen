'use client'

import { useState } from 'react'
import { IconAlertTriangle } from '@tabler/icons-react'
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

import type { AcademicTerm } from '../data/schema'

interface DeleteConfirmationModalProps {
  academicTerm: AcademicTerm
  onDeleteAcademicTerm?: (academicTerm: AcademicTerm) => Promise<void>
  trigger: React.ReactNode
}

// DeleteConfirmationModal - show delete confirmation for academic term
export function DeleteConfirmationModal({
  academicTerm,
  onDeleteAcademicTerm,
  trigger,
}: DeleteConfirmationModalProps) {
  // ==================== STATE ====================
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // handleOpenChange - update dialog state
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
  }

  // handleDeleteClick - delete academic term row
  const handleDeleteClick = async () => {
    try {
      setIsDeleting(true)
      await onDeleteAcademicTerm?.(academicTerm)
      toast.success('Academic term deleted', {
        description: `${academicTerm.academicTermName} was removed successfully.`,
      })
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete academic term.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
            <IconAlertTriangle size={28} stroke={2} />
          </div>
          <DialogTitle className="text-center">Delete Academic Term</DialogTitle>
          <DialogDescription className="text-center">
            Are you sure you want to delete {academicTerm.academicTermName}? This action is static
            for now.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="grid grid-cols-2 gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="destructive"
            className="w-full cursor-pointer"
            onClick={handleDeleteClick}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="w-full cursor-pointer" disabled={isDeleting}>
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
