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
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[560px]">
        <DialogHeader className="px-6 pt-6 pb-4 text-left">
          <DialogTitle>{subject.subjectName}</DialogTitle>
          <DialogDescription>Subject information and assigned sections.</DialogDescription>
        </DialogHeader>

        <div className="max-h-[50vh] space-y-6 overflow-y-auto border-t border-b px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="font-semibold">Subject Code</p>
              <p className="text-muted-foreground">{subject.subjectCode}</p>
            </div>
            <Badge variant="outline" className={`${statusClassName} shrink-0`}>
              {subject.status === 'active' ? 'Active' : 'Inactive'}
            </Badge>
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
