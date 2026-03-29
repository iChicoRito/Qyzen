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
  const [internalOpen, setInternalOpen] = useState(false)
  const statusClassName =
    section.status === 'active'
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
            View Section
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent
        showCloseButton={false}
        className="overflow-hidden border-0 bg-background p-0 shadow-none sm:max-w-[560px]"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{section.sectionName}</DialogTitle>
          <DialogDescription>Section information and assigned academic terms.</DialogDescription>
        </DialogHeader>

        <div className="overflow-hidden rounded-[28px] bg-background">
          <div className="px-6 pb-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b py-6">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold tracking-tight">{section.sectionName}</h2>
                <p className="text-sm text-muted-foreground">
                  Section information and assigned academic terms.
                </p>
              </div>
              <Badge variant="outline" className={`${statusClassName} mt-1 shrink-0`}>
                {section.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <div className="max-h-[40vh] space-y-6 overflow-y-auto py-6">
              <div className="space-y-2">
                <p className="font-semibold">Section ID</p>
                <p className="text-muted-foreground">{section.id}</p>
              </div>

              <div className="space-y-2">
                <p className="font-semibold">Section Name</p>
                <p className="text-muted-foreground">{section.sectionName}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <p className="font-semibold">Academic Terms</p>
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
