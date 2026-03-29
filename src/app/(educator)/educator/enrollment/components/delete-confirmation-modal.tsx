'use client'

import { useState } from 'react'
import { IconAlertTriangle, IconLoader2 as Loader2 } from '@tabler/icons-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { deleteEnrollment, type EnrollmentRecord } from '@/lib/supabase/enrollments'

interface DeleteConfirmationModalProps {
  enrollment: EnrollmentRecord
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onEnrollmentDeleted?: (id: number) => void
}

// DeleteConfirmationModal - confirm student un-enrollment
export function DeleteConfirmationModal({ enrollment, trigger, open, onOpenChange, onEnrollmentDeleted }: DeleteConfirmationModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const dialogOpen = open ?? internalOpen
  const setDialogOpen = onOpenChange ?? setInternalOpen

  const handleDeleteClick = async () => {
    try {
      setIsDeleting(true)
      await deleteEnrollment(enrollment.id)
      onEnrollmentDeleted?.(enrollment.id)
      toast.success('Student un-enrolled successfully.')
      setDialogOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to un-enroll student.')
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
            <DialogTitle className="text-center">Are you sure you want to un-enroll this student?</DialogTitle>
            <DialogDescription className="max-w-[34rem] text-center">
              This will remove {enrollment.student.fullName} from {enrollment.subject.subjectName}. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="grid w-full max-w-[26rem] grid-cols-2 gap-3">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="h-11 w-full cursor-pointer">
                Cancel
              </Button>
            </DialogClose>
            <Button type="button" variant="destructive" onClick={handleDeleteClick} className="h-11 w-full cursor-pointer" disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  Un-enrolling...
                </>
              ) : (
                'Un-enroll'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
