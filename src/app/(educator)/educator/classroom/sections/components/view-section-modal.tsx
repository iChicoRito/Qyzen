'use client'

import { IconEye, IconSchool } from '@tabler/icons-react'

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
import { type SectionRecord } from '@/lib/supabase/sections'

interface ViewSectionModalProps {
  section: SectionRecord
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

// ViewSectionModal - view section details
export function ViewSectionModal({
  section,
  trigger,
  open,
  onOpenChange,
}: ViewSectionModalProps) {
  // ==================== UI STATE ====================
  const statusClassName =
    section.status === 'active'
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
              View Section
            </Button>
          )}
        </DialogTrigger>
      ) : null}
      <DialogContent className="border-0 bg-transparent p-0 shadow-none sm:max-w-[500px]">
        <DialogHeader className="sr-only">
          <DialogTitle>{section.sectionName}</DialogTitle>
          <DialogDescription>Section information and assigned academic terms.</DialogDescription>
        </DialogHeader>
        <Card className="gap-0 overflow-hidden py-0 shadow-xl">
          <div className="flex h-28 items-center justify-center border-b bg-muted">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background">
              <IconSchool size={32} className="text-muted-foreground" />
            </div>
          </div>

          <CardHeader className="border-b px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-lg">{section.sectionName}</CardTitle>
                <CardDescription>Section information and assigned academic terms.</CardDescription>
              </div>
              <Badge variant="outline" className={`${statusClassName} shrink-0`}>
                {section.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardHeader>

          <div className="max-h-[32vh] overflow-y-auto">
            <CardContent className="space-y-5 px-4 pt-4 pb-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Section ID</p>
                <p className="text-muted-foreground">{section.id}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">Section Name</p>
                <p className="text-muted-foreground">{section.sectionName}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">Academic Terms</p>
                  <Badge variant="secondary" className="rounded-md px-2.5 py-0.5">
                    {section.academicTerms.length}
                  </Badge>
                </div>

                {section.academicTerms.length === 0 ? (
                  <p className="text-muted-foreground">No academic terms assigned.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {section.academicTerms.map((academicTerm) => (
                      <Badge
                        key={academicTerm.id}
                        variant="outline"
                        className="rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-blue-500"
                      >
                        {academicTerm.label}
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
