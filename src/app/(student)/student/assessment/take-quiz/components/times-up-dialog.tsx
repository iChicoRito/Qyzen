'use client'

import { IconClock } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface TimesUpDialogProps {
  open: boolean
  onContinue: () => void
}

// TimesUpDialog - notify students when timer reaches zero
export function TimesUpDialog({ open, onContinue }: TimesUpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => undefined}>
      <DialogContent showCloseButton={false} className="rounded-[1rem] sm:max-w-[500px]">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
            <IconClock size={32} />
          </div>

          <DialogHeader className="items-center text-center sm:text-center">
            <DialogTitle className="text-center">Time&apos;s Up!</DialogTitle>
            <DialogDescription className="max-w-[34rem] text-center">
              Your assessment time has ended. Your answers have been submitted automatically. Continue to view your result.
            </DialogDescription>
          </DialogHeader>

          <div className="w-full max-w-[26rem]">
            <Button type="button" className="h-10 w-full cursor-pointer" onClick={onContinue}>
              View Result
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
