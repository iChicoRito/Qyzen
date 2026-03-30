'use client'

import { IconAlertTriangle } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CheatingWarningDialogProps {
  open: boolean
  remainingAttempts: number
  onContinue: () => void
}

// CheatingWarningDialog - warn students when they switch tabs
export function CheatingWarningDialog({
  open,
  remainingAttempts,
  onContinue,
}: CheatingWarningDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => undefined}>
      <DialogContent showCloseButton={false} className="rounded-[1rem] sm:max-w-[500px]">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-500">
            <IconAlertTriangle size={32} />
          </div>

          <DialogHeader className="items-center text-center sm:text-center">
            <DialogTitle className="text-center">Warning: Tab switching detected</DialogTitle>
            <DialogDescription className="max-w-[34rem] text-center">
              {remainingAttempts > 0
                ? `You have ${remainingAttempts} warning attempt${remainingAttempts === 1 ? '' : 's'} left. Switching tabs again may force submit your quiz.`
                : 'You have no warning attempts left. The quiz will be submitted automatically.'}
            </DialogDescription>
          </DialogHeader>

          <div className="w-full max-w-[26rem]">
            <Button type="button" className="h-10 w-full cursor-pointer" onClick={onContinue}>
              Continue Quiz
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
