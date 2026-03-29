'use client'

import { useState } from 'react'
import { IconEye } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { type EnrollmentRecord } from '@/lib/supabase/enrollments'

interface ViewEnrollmentModalProps {
  enrollment: EnrollmentRecord
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

// getStatusClassName - build badge class by status
function getStatusClassName(status: 'active' | 'inactive') {
  if (status === 'active') return 'rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500'
  return 'rounded-md border-0 bg-rose-500/10 px-2.5 py-0.5 text-rose-500'
}

// ViewEnrollmentModal - show enrollment details
export function ViewEnrollmentModal({ enrollment, trigger, open, onOpenChange }: ViewEnrollmentModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const fullName = enrollment.student.fullName
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name.charAt(0))
    .join('')
    .toUpperCase()
  const isControlled = open !== undefined
  const dialogOpen = open ?? internalOpen
  const setDialogOpen = onOpenChange ?? setInternalOpen

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : !isControlled ? (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="cursor-pointer">
            <IconEye size={18} />
            View Enrollment
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent
        showCloseButton={false}
        className="overflow-hidden border-0 bg-background p-0 shadow-none sm:max-w-[560px]"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{fullName}</DialogTitle>
          <DialogDescription>Student enrollment details and assigned subject information.</DialogDescription>
        </DialogHeader>

        <div className="overflow-hidden rounded-[28px] bg-background">
          <div className="px-2 pt-2">
            <div className="h-[160px] rounded-[28px] bg-muted" />
          </div>

          <div className="px-6 pb-6">
            <div className="-mt-12 flex h-24 w-24 items-center justify-center rounded-full border-4 border-background bg-background shadow-lg">
              <span className="sr-only">{fullName}</span>
              <div className="flex h-[5.25rem] w-[5.25rem] items-center justify-center rounded-full bg-muted">
                <span className="text-xl font-semibold tracking-tight">{initials}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-start justify-between gap-4 border-b pb-6">
              <div className="min-w-0 space-y-1">
                <h2 className="font-semibold tracking-tight">{fullName}</h2>
                <p className="text-sm text-muted-foreground">Student enrollment details and assigned subject information.</p>
              </div>
              <Badge variant="outline" className={`${getStatusClassName(enrollment.status)} mt-1 shrink-0`}>
                {enrollment.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <div className="max-h-[40vh] space-y-6 overflow-y-auto py-6">
              <div className="space-y-2">
                <p className="font-semibold">Student ID</p>
                <p className="text-base text-muted-foreground">{enrollment.student.userId}</p>
              </div>

              <div className="space-y-2">
                <p className="font-semibold">Student Name</p>
                <p className="text-base text-muted-foreground">{fullName}</p>
              </div>

              <div className="space-y-3">
                <p className="font-semibold">Subject</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="rounded-md px-2.5 py-0.5">
                    {enrollment.subject.subjectCode}
                  </Badge>
                  <p className="w-full text-base text-muted-foreground">{enrollment.subject.subjectName}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="font-semibold">Section</p>
                <Badge variant="outline" className="rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-blue-500">
                  {enrollment.subject.section.name}
                </Badge>
              </div>

              <div className="space-y-2">
                <p className="font-semibold">Educator</p>
                <p className="text-base text-muted-foreground">{enrollment.educator.fullName}</p>
              </div>

              <div className="space-y-3">
                <p className="font-semibold">Student Status</p>
                <Badge variant="outline" className={getStatusClassName(enrollment.student.status)}>
                  {enrollment.student.status === 'active' ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            <DialogClose asChild>
              <Button variant="outline" className="h-10 w-full cursor-pointer rounded-xl">
                Close
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
