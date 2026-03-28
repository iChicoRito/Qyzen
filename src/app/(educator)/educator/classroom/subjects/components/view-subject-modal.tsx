'use client'

import { IconBook2, IconEye } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  // ==================== UI STATE ====================
  const statusClassName =
    subject.status === 'active'
      ? 'rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500'
      : 'rounded-md border-0 bg-rose-500/10 px-2.5 py-0.5 text-rose-500'

  // ==================== RENDER ====================
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger !== null ? (
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm" className="cursor-pointer">
              <IconEye size={18} />
              View Subject
            </Button>
          )}
        </DialogTrigger>
      ) : null}
      <DialogContent className="border-0 bg-transparent p-0 shadow-none sm:max-w-[336px]">
        <DialogHeader className="sr-only">
          <DialogTitle>{subject.subjectName}</DialogTitle>
          <DialogDescription>Subject information and assigned sections.</DialogDescription>
        </DialogHeader>
        <Card className="gap-0 overflow-hidden py-0 shadow-xl">
          <div className="flex h-28 items-center justify-center border-b bg-muted">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background">
              <IconBook2 size={32} className="text-muted-foreground" />
            </div>
          </div>

          <CardHeader className="border-b px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-lg">{subject.subjectName}</CardTitle>
                <CardDescription>{subject.subjectCode}</CardDescription>
              </div>
              <Badge variant="outline" className={`${statusClassName} shrink-0`}>
                {subject.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardHeader>

          <div className="max-h-[32vh] overflow-y-auto">
            <CardContent className="space-y-5 px-4 pt-4 pb-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Subject Code</p>
                <p className="text-muted-foreground">{subject.subjectCode}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">Subject Name</p>
                <p className="text-muted-foreground">{subject.subjectName}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">Assigned Sections</p>
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
            </CardContent>
          </div>

          <CardFooter className="border-t py-5">
            <DialogClose asChild>
              <Button variant="outline" className="w-full cursor-pointer">
                Close
              </Button>
            </DialogClose>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
