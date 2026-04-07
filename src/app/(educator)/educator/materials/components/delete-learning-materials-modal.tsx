'use client'

import { useState } from 'react'
import { IconAlertTriangle, IconLoader2 as Loader2 } from '@tabler/icons-react'
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

interface DeleteLearningMaterialsModalProps {
  fileCount: number
  fileLabel: string
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onConfirmDelete: () => Promise<void>
}

// DeleteLearningMaterialsModal - confirm one or more learning material deletions
export function DeleteLearningMaterialsModal({
  fileCount,
  fileLabel,
  trigger,
  open,
  onOpenChange,
  onConfirmDelete,
}: DeleteLearningMaterialsModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const dialogOpen = open ?? internalOpen
  const setDialogOpen = onOpenChange ?? setInternalOpen

  // handleDeleteClick - confirm and delete selected learning materials
  const handleDeleteClick = async () => {
    try {
      setIsDeleting(true)
      await onConfirmDelete()
      toast.success(
        fileCount > 1 ? 'Selected learning materials deleted.' : 'Learning material deleted successfully.'
      )
      setDialogOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete learning materials.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent
        overlayClassName="bg-transparent backdrop-blur-sm"
        showCloseButton={false}
        className="rounded-[1rem] sm:max-w-[500px]"
      >
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/12 text-destructive">
            <IconAlertTriangle size={32} />
          </div>

          <DialogHeader className="items-center text-center sm:text-center">
            <DialogTitle className="text-center">Are you absolutely sure you want to delete?</DialogTitle>
            <DialogDescription className="max-w-[34rem] text-center">
              {fileCount > 1
                ? `This will permanently delete ${fileCount} files, including ${fileLabel}. This action cannot be undone.`
                : `This will permanently delete ${fileLabel}. This action cannot be undone.`}
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
              {isDeleting ? (
                <>
                  <Loader2 size={18} className="mr-0 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
