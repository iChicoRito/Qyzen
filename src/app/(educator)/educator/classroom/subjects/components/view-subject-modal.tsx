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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { type SubjectRecord } from '@/lib/supabase/subjects'

interface ViewSubjectModalProps {
  subject: SubjectRecord
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

// ViewSubjectModal - view subject details
export function ViewSubjectModal({
  subject,
  trigger,
  open,
  onOpenChange,
}: ViewSubjectModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const statusClassName =
    subject.status === 'active'
      ? 'rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500'
      : 'rounded-md border-0 bg-rose-500/10 px-2.5 py-0.5 text-rose-500'
  const dialogOpen = open ?? internalOpen
  const setDialogOpen = onOpenChange ?? setInternalOpen

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : open === undefined ? (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="cursor-pointer">
            <IconEye size={18} />
            View Subject
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent
        showCloseButton={false}
        className="overflow-hidden border-0 bg-background p-0 shadow-none sm:max-w-[560px]"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{subject.subjectName}</DialogTitle>
          <DialogDescription>Subject information and assigned sections.</DialogDescription>
        </DialogHeader>

        <div className="overflow-hidden rounded-[28px] bg-background">
          <div className="px-6 pb-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b py-6">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold tracking-tight">{subject.subjectName}</h2>
                <p className="text-sm text-muted-foreground">Subject information and assigned sections.</p>
              </div>
              <Badge variant="outline" className={`${statusClassName} mt-1 shrink-0`}>
                {subject.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <div className="max-h-[40vh] space-y-6 overflow-y-auto py-6">
              <div className="space-y-2">
                <p className="font-semibold">Subject Code</p>
                <p className="text-muted-foreground">{subject.subjectCode}</p>
              </div>

              <div className="space-y-2">
                <p className="font-semibold">Subject Name</p>
                <p className="text-muted-foreground">{subject.subjectName}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <p className="font-semibold">Assigned Sections</p>
                  <Badge variant="secondary" className="rounded-md px-2.5 py-0.5">
                    {subject.sections.length}
                  </Badge>
                </div>

                {subject.sections.length === 0 ? (
                  <p className="text-muted-foreground">No sections assigned.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {subject.sections.map((section) => (
                      <Badge
                        key={section.id}
                        variant="outline"
                        className="rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-blue-500"
                      >
                        {section.name}
                      </Badge>
                    ))}
                  </div>
                )}
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
