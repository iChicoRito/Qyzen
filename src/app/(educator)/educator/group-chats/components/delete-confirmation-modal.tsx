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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { deleteEducatorGroupChat } from '@/lib/supabase/group-chats'

import { type EducatorManagedGroupChatRow } from '../data/schema'

interface DeleteConfirmationModalProps {
  groupChat: EducatorManagedGroupChatRow
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onGroupChatDeleted?: (groupChatId: number) => void
}

// DeleteConfirmationModal - confirm removal of one educator-owned group chat
export function DeleteConfirmationModal({
  groupChat,
  trigger,
  open,
  onOpenChange,
  onGroupChatDeleted,
}: DeleteConfirmationModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const dialogOpen = open ?? internalOpen
  const setDialogOpen = onOpenChange ?? setInternalOpen

  const handleDeleteClick = async () => {
    try {
      setIsDeleting(true)
      await deleteEducatorGroupChat(groupChat.id)
      onGroupChatDeleted?.(groupChat.id)
      toast.success('Group chat deleted successfully.')
      setDialogOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete the group chat.')
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
            <IconAlertTriangle size={32} />
          </div>

          <DialogHeader className="items-center text-center sm:text-center">
            <DialogTitle className="text-center">
              Delete this group chat?
            </DialogTitle>
            <DialogDescription className="max-w-[34rem] text-center">
              This will permanently remove {groupChat.subjectName} for section {groupChat.sectionName},
              including all related chat messages and read history.
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
