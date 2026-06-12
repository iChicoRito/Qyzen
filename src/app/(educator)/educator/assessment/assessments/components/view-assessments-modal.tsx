'use client'

import { useState } from 'react'
import { IconEye } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from '@/components/ui/responsive-dialog'

import type { Assessment } from '../data/schema'

interface ViewAssessmentsModalProps {
  assessment: Assessment
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

// ViewAssessmentsModal - view assessment details
export function ViewAssessmentsModal({
  assessment,
  trigger,
  open,
  onOpenChange,
}: ViewAssessmentsModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const dialogOpen = open ?? internalOpen
  const setDialogOpen = onOpenChange ?? setInternalOpen

  const statusClassName =
    assessment.status === 'active'
      ? 'rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500'
      : 'rounded-md border-0 bg-rose-500/10 px-2.5 py-0.5 text-rose-500'

  const shuffleClassName = assessment.isShuffle
    ? 'rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-blue-500'
    : 'rounded-md border-0 bg-yellow-500/10 px-2.5 py-0.5 text-yellow-500'

  const reviewClassName = assessment.allowReview
    ? 'rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500'
    : 'rounded-md border-0 bg-yellow-500/10 px-2.5 py-0.5 text-yellow-500'

  const hintClassName = assessment.allowHint
    ? 'rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-blue-500'
    : 'rounded-md border-0 bg-yellow-500/10 px-2.5 py-0.5 text-yellow-500'

  const retakeClassName = assessment.allowRetake
    ? 'rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-blue-500'
    : 'rounded-md border-0 bg-yellow-500/10 px-2.5 py-0.5 text-yellow-500'

  return (
    <ResponsiveDialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger ? (
        <ResponsiveDialogTrigger asChild>{trigger}</ResponsiveDialogTrigger>
      ) : open === undefined ? (
        <ResponsiveDialogTrigger asChild>
          <Button variant="outline" size="sm" className="cursor-pointer">
            <IconEye size={18} />
            View Assessment
          </Button>
        </ResponsiveDialogTrigger>
      ) : null}
      <ResponsiveDialogContent className="gap-0 p-0" desktopClassName="sm:max-w-[560px]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{assessment.assessmentCode}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Assessment information and schedule details.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="max-h-[60vh] space-y-6 border-t border-b">
          <div className="flex items-start justify-end gap-4">
            <Badge variant="outline" className={`${statusClassName} shrink-0`}>
              {assessment.status === 'active' ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          <div className="space-y-2">
            <p className="font-semibold">Subject</p>
            <p className="text-muted-foreground">{assessment.subjectName}</p>
          </div>

          <div className="space-y-2">
            <p className="font-semibold">Section</p>
            <p className="text-muted-foreground">{assessment.sectionName}</p>
          </div>

          <div className="space-y-2">
            <p className="font-semibold">Academic Term</p>
            <p className="text-muted-foreground">{assessment.termName}</p>
          </div>

          <div className="space-y-2">
            <p className="font-semibold">Time Limit</p>
            <p className="text-muted-foreground">{assessment.timeLimit}</p>
          </div>

          <div className="space-y-3">
            <p className="font-semibold">Shuffle</p>
            <Badge variant="outline" className={shuffleClassName}>
              {assessment.isShuffle ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>

          <div className="space-y-3">
            <p className="font-semibold">Allow Review</p>
            <Badge variant="outline" className={reviewClassName}>
              {assessment.allowReview ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>

          <div className="space-y-3">
            <p className="font-semibold">Allow Hint</p>
            <Badge variant="outline" className={hintClassName}>
              {assessment.allowHint ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>

          <div className="space-y-3">
            <p className="font-semibold">Allow Retake</p>
            <Badge variant="outline" className={retakeClassName}>
              {assessment.allowRetake ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>

          <div className="space-y-2">
            <p className="font-semibold">Retake Count</p>
            <p className="text-muted-foreground">{assessment.allowRetake ? assessment.retakeCount : 0}</p>
          </div>

          <div className="space-y-2">
            <p className="font-semibold">Hint Count</p>
            <p className="text-muted-foreground">{assessment.allowHint ? assessment.hintCount : 0}</p>
          </div>

          <div className="space-y-2">
            <p className="font-semibold">Schedule</p>
            <p className="text-muted-foreground">
              {assessment.startDate} {assessment.startTime}
            </p>
            <p className="text-muted-foreground">
              {assessment.endDate} {assessment.endTime}
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-semibold">Cheating Attempts</p>
            <p className="text-muted-foreground">{assessment.cheatingAttempts}</p>
          </div>
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter className="sm:justify-start">
          <ResponsiveDialogClose asChild>
            <Button type="button" variant="outline" className="cursor-pointer">
              Close
            </Button>
          </ResponsiveDialogClose>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

