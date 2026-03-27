'use client'

import { useState } from 'react'

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

import type { AcademicYear } from '../data/schema'

interface DeleteConfirmationModalProps {
  academicYear: AcademicYear
  trigger: React.ReactNode
}

// DeleteConfirmationModal - show delete confirmation
export function DeleteConfirmationModal({
  academicYear,
  trigger,
}: DeleteConfirmationModalProps) {
  // ==================== STATE ====================
  const [open, setOpen] = useState(false)

  // handleDeleteClick - close static modal
  const handleDeleteClick = () => {
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Academic Year</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {academicYear.academicYear}? This action is static for
            now.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="cursor-pointer">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeleteClick}
            className="cursor-pointer"
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
