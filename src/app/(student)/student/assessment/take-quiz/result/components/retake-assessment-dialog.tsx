'use client'

import { useRouter } from 'next/navigation'
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

interface RetakeAssessmentDialogProps {
  moduleId: number
}

// RetakeAssessmentDialog - confirm whether the student wants to start a new retake attempt
export function RetakeAssessmentDialog({ moduleId }: RetakeAssessmentDialogProps) {
  const router = useRouter()

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full cursor-pointer">Retake Assessment</Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="rounded-[1rem] sm:max-w-[500px]">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-500">
            <IconAlertTriangle size={32} />
          </div>

          <DialogHeader className="items-center text-center sm:text-center">
            <DialogTitle className="text-center">Retake this assessment?</DialogTitle>
            <DialogDescription className="max-w-[34rem] text-center">
              You are about to start another attempt for this assessment. Make sure you are
              ready before proceeding because this will open a fresh quiz session.
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
              className="h-10 w-full cursor-pointer"
              onClick={() => {
                router.push(`/student/assessment/take-quiz?moduleId=${moduleId}`)
              }}
            >
              Proceed
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
