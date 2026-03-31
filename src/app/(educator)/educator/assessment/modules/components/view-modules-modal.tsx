'use client'

import { useState } from 'react'
import { IconEye } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
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

import type { Module } from '../data/schema'

interface ViewModulesModalProps {
  module: Module
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

// ViewModulesModal - view module details
export function ViewModulesModal({
  module,
  trigger,
  open,
  onOpenChange,
}: ViewModulesModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const dialogOpen = open ?? internalOpen
  const setDialogOpen = onOpenChange ?? setInternalOpen

  const statusClassName =
    module.status === 'active'
      ? 'rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500'
      : 'rounded-md border-0 bg-rose-500/10 px-2.5 py-0.5 text-rose-500'

  const shuffleClassName = module.isShuffle
    ? 'rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-blue-500'
    : 'rounded-md border-0 bg-yellow-500/10 px-2.5 py-0.5 text-yellow-500'

  const reviewClassName = module.allowReview
    ? 'rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500'
    : 'rounded-md border-0 bg-yellow-500/10 px-2.5 py-0.5 text-yellow-500'

  const hintClassName = module.allowHint
    ? 'rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-blue-500'
    : 'rounded-md border-0 bg-yellow-500/10 px-2.5 py-0.5 text-yellow-500'

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : open === undefined ? (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="cursor-pointer">
            <IconEye size={18} />
            View Module
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[560px]">
        <DialogHeader className="px-6 pt-6 pb-4 text-left">
          <DialogTitle>{module.moduleCode}</DialogTitle>
          <DialogDescription>Module information and schedule details.</DialogDescription>
        </DialogHeader>

        <div className="max-h-[50vh] space-y-6 overflow-y-auto border-t border-b px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="font-semibold">Module ID</p>
              <p className="text-muted-foreground">{module.moduleId}</p>
            </div>
            <Badge variant="outline" className={`${statusClassName} shrink-0`}>
              {module.status === 'active' ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          <div className="space-y-2">
            <p className="font-semibold">Subject</p>
            <p className="text-muted-foreground">{module.subjectName}</p>
          </div>

          <div className="space-y-2">
            <p className="font-semibold">Section</p>
            <p className="text-muted-foreground">{module.sectionName}</p>
          </div>

          <div className="space-y-2">
            <p className="font-semibold">Academic Term</p>
            <p className="text-muted-foreground">{module.termName}</p>
          </div>

          <div className="space-y-2">
            <p className="font-semibold">Time Limit</p>
            <p className="text-muted-foreground">{module.timeLimit}</p>
          </div>

          <div className="space-y-3">
            <p className="font-semibold">Shuffle</p>
            <Badge variant="outline" className={shuffleClassName}>
              {module.isShuffle ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>

          <div className="space-y-3">
            <p className="font-semibold">Allow Review</p>
            <Badge variant="outline" className={reviewClassName}>
              {module.allowReview ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>

          <div className="space-y-3">
            <p className="font-semibold">Allow Hint</p>
            <Badge variant="outline" className={hintClassName}>
              {module.allowHint ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>

          <div className="space-y-2">
            <p className="font-semibold">Hint Count</p>
            <p className="text-muted-foreground">{module.allowHint ? module.hintCount : 0}</p>
          </div>

          <div className="space-y-2">
            <p className="font-semibold">Schedule</p>
            <p className="text-muted-foreground">
              {module.startDate} {module.startTime}
            </p>
            <p className="text-muted-foreground">
              {module.endDate} {module.endTime}
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-semibold">Cheating Attempts</p>
            <p className="text-muted-foreground">{module.cheatingAttempts}</p>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="cursor-pointer">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
