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
    <ResponsiveDialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger ? (
        <ResponsiveDialogTrigger asChild>{trigger}</ResponsiveDialogTrigger>
      ) : open === undefined ? (
        <ResponsiveDialogTrigger asChild>
          <Button variant="outline" size="sm" className="cursor-pointer">
            <IconEye size={18} />
            View Section
          </Button>
        </ResponsiveDialogTrigger>
      ) : null}
      <ResponsiveDialogContent className="gap-0 p-0" desktopClassName="sm:max-w-[560px]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{section.sectionName}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Section information and assigned academic terms.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="max-h-[60vh] space-y-6 border-t border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="font-semibold">Section ID</p>
              <p className="text-muted-foreground">{section.id}</p>
            </div>
            <Badge variant="outline" className={`${statusClassName} shrink-0`}>
              {section.status === 'active' ? 'Active' : 'Inactive'}
            </Badge>
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
