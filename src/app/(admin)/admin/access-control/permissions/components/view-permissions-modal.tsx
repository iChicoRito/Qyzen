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

import type { Permission } from '../data/schema'

interface ViewPermissionsModalProps {
  permission: Permission
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

// ViewPermissionsModal - view permission details
export function ViewPermissionsModal({
  permission,
  trigger,
  open,
  onOpenChange,
}: ViewPermissionsModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const statusClassName =
    permission.status === 'active'
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
            <IconEye className="h-4 w-4" stroke={2} />
            View Permission
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent
        showCloseButton={false}
        className="overflow-hidden border-1 p-0 shadow-none sm:max-w-[560px]"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{permission.permissionName}</DialogTitle>
          <DialogDescription>
            Permission information and access details.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-hidden rounded-[28px]">
          <div className="px-6 pb-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b py-6">
              <div className="space-y-1">
                <h2 className="font-semibold tracking-tight">{permission.permissionName}</h2>
                <p className="text-muted-foreground">
                  Permission information and access details.
                </p>
              </div>
              <Badge variant="outline" className={`${statusClassName} mt-1 shrink-0`}>
                {permission.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <div className="max-h-[40vh] space-y-6 overflow-y-auto py-6">
              <div className="space-y-2">
                <p className="font-semibold">Description</p>
                <p className="text-muted-foreground">{permission.description}</p>
              </div>

              <div className="space-y-3">
                <p className="font-semibold">Permission String</p>
                <Badge
                  variant="outline"
                  className="rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-blue-500"
                >
                  {permission.permissionString}
                </Badge>
              </div>

              <div className="space-y-2">
                <p className="font-semibold">Module</p>
                <p className="text-muted-foreground">{permission.module}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="font-semibold">Resource</p>
                  <p className="text-muted-foreground">{permission.resource}</p>
                </div>

                <div className="space-y-2">
                  <p className="font-semibold">Action</p>
                  <p className="text-muted-foreground">{permission.action}</p>
                </div>
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
