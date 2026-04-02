'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import { IconChevronDown, IconEye } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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

import {
  getAssessmentStatusClassName,
  getAssessmentStatusLabel,
  getLatestAttemptStatusLabel,
  getPresenceStatusClassName,
  getPresenceStatusLabel,
} from '../data/data'
import type { EducatorRealtimeMonitoringRow } from '../data/schema'

interface ViewStudentsModalProps {
  row: EducatorRealtimeMonitoringRow
  trigger?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

// formatDateTimeLabel - format nullable timestamps for the modal
function formatDateTimeLabel(value: string | null) {
  if (!value) {
    return 'Not available'
  }

  const timestamp = new Date(value)

  if (Number.isNaN(timestamp.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(timestamp)
}

// getLatestAttemptSummary - build a short latest attempt summary
function getLatestAttemptSummary(student: EducatorRealtimeMonitoringRow['students'][number]) {
  if (student.latestAttemptStatus === 'NOT_STARTED') {
    return 'No attempt yet'
  }

  if (student.latestAttemptStatus === 'IN_PROGRESS') {
    return `In progress${student.latestTotalQuestions ? ` - ${student.latestTotalQuestions} questions` : ''}`
  }

  if (student.latestScore === null || student.latestTotalQuestions === null) {
    return getLatestAttemptStatusLabel(student.latestAttemptStatus)
  }

  return `${getLatestAttemptStatusLabel(student.latestAttemptStatus)} - ${student.latestScore}/${student.latestTotalQuestions}`
}

// ViewStudentsModal - display monitored students for one module
export function ViewStudentsModal({
  row,
  trigger,
  open,
  onOpenChange,
}: ViewStudentsModalProps) {
  // ==================== STATE ====================
  const [internalOpen, setInternalOpen] = useState(false)
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)
  const dialogOpen = open ?? internalOpen
  const setDialogOpen = onOpenChange ?? setInternalOpen

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : open === undefined ? (
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="cursor-pointer">
            <IconEye size={18} />
            View Students
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="flex h-[90vh] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden p-0 sm:h-[88vh] sm:max-w-[1100px] xl:max-w-[1320px]">
        <DialogHeader className="border-b px-4 pt-5 pb-4 text-left sm:px-6 sm:pt-6">
          <DialogTitle>Monitor Students</DialogTitle>
          <DialogDescription>
            Review live student activity for this assessment module.
          </DialogDescription>

          <Collapsible open={isSummaryOpen} onOpenChange={setIsSummaryOpen} className="mt-4 border-t pt-4">
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="flex w-full items-center justify-between cursor-pointer"
              >
                <span>Assessment Details</span>
                <IconChevronDown
                  size={18}
                  className={`transition-transform ${isSummaryOpen ? 'rotate-180' : ''}`}
                />
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="pt-4">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-1">
                  <div className="text-muted-foreground text-xs uppercase">Module</div>
                  <div className="text-sm font-semibold sm:text-base">{row.moduleCode}</div>
                  <div className="text-muted-foreground break-all text-sm">{row.moduleId}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground text-xs uppercase">Subject</div>
                  <div className="text-sm font-semibold sm:text-base">{row.subjectName}</div>
                  <div className="text-muted-foreground text-sm">{row.termName}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground text-xs uppercase">Section</div>
                  <div className="text-sm font-semibold sm:text-base">{row.sectionName}</div>
                  <div className="text-muted-foreground text-sm">{row.questionCount} questions</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground text-xs uppercase">Overview</div>
                  <div className="text-sm font-semibold sm:text-base">
                    {row.enrolledCount} enrolled
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {row.answeringCount} answering, {row.onlineCount} online, {row.finishedCount} finished
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {row.students.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center text-sm">
              No enrolled students found for this module.
            </div>
          ) : (
            <div className="space-y-4">
              {row.students.map((student) => (
              <div key={student.studentId} className="rounded-lg border p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1">
                    <div className="font-medium">{student.studentName}</div>
                    <div className="text-muted-foreground text-sm">{student.studentUserId}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getAssessmentStatusClassName(student.assessmentStatus)}>
                      {getAssessmentStatusLabel(student.assessmentStatus)}
                    </Badge>
                    <Badge className={getPresenceStatusClassName(student.presenceStatus)}>
                      {getPresenceStatusLabel(student.presenceStatus)}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  <div className="space-y-1">
                    <div className="text-muted-foreground text-xs uppercase">Last Seen</div>
                    <div className="text-sm font-medium">{formatDateTimeLabel(student.lastSeenAt)}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground text-xs uppercase">Current Page</div>
                    <div className="break-all text-sm font-medium">{student.currentPath || 'Not available'}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground text-xs uppercase">Latest Attempt</div>
                    <div className="text-sm font-medium">{getLatestAttemptSummary(student)}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground text-xs uppercase">Warnings</div>
                    <div className="text-sm font-medium">{student.warningAttempts}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground text-xs uppercase">Taken At</div>
                    <div className="text-sm font-medium">{formatDateTimeLabel(student.latestTakenAt)}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground text-xs uppercase">Submitted At</div>
                    <div className="text-sm font-medium">{formatDateTimeLabel(student.latestSubmittedAt)}</div>
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}
        </div>

        <DialogFooter className="border-t px-4 py-4 sm:justify-start sm:px-6">
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
