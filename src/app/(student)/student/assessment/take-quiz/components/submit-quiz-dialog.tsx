'use client'

import { IconAlertTriangle, IconLoader2 as Loader2 } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface SubmitQuizDialogProps {
  open: boolean
  isSubmitting: boolean
  unansweredCount: number
  onOpenChange: (open: boolean) => void
  onSubmit: () => void
}

// SubmitQuizDialog - confirm quiz submission
export function SubmitQuizDialog({
  open,
  isSubmitting,
  unansweredCount,
  onOpenChange,
  onSubmit,
}: SubmitQuizDialogProps) {
  const hasUnansweredQuestions = unansweredCount > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="rounded-[1rem] sm:max-w-[500px]">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
            <IconAlertTriangle size={32} />
          </div>

          <DialogHeader className="items-center text-center sm:text-center">
            <DialogTitle className="text-center">
              {hasUnansweredQuestions
                ? 'Submit with unanswered questions?'
                : 'Submit your assessment?'}
            </DialogTitle>
            <DialogDescription className="max-w-[34rem] text-center">
              {hasUnansweredQuestions
                ? `You still have ${unansweredCount} unanswered question${
                    unansweredCount === 1 ? '' : 's'
                  }. Are you sure you want to submit your assessment with blank answers? Once submitted, your score will be finalized.`
                : 'Make sure you have reviewed your answers. Once submitted, your score will be finalized.'}
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
              onClick={onSubmit}
              className="h-10 w-full cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="mr-0 animate-spin" />
                  Saving...
                </>
              ) : (
                hasUnansweredQuestions ? 'Submit Anyway' : 'Submit'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
