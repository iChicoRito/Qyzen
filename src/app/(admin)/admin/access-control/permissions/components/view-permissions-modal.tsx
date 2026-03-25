'use client'

import { IconEye } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
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
}

// ViewPermissionsModal - view permission details
export function ViewPermissionsModal({ permission, trigger }: ViewPermissionsModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="cursor-pointer">
            <IconEye className="h-4 w-4" stroke={2} />
            View Permission
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>View Permission</DialogTitle>
          <DialogDescription>Review the selected permission details.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border p-4">
            <p className="text-sm text-muted-foreground">Permission Name</p>
            <p className="mt-1 font-medium">{permission.permissionName}</p>
          </div>

          <div className="rounded-md border p-4">
            <p className="text-sm text-muted-foreground">Description</p>
            <p className="mt-1 whitespace-pre-wrap">{permission.description}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-md border p-4">
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="mt-1 font-medium">{permission.role}</p>
            </div>

            <div className="rounded-md border p-4">
              <p className="text-sm text-muted-foreground">Action</p>
              <p className="mt-1 font-medium capitalize">{permission.action}</p>
            </div>

            <div className="rounded-md border p-4">
              <p className="text-sm text-muted-foreground">Module</p>
              <p className="mt-1 font-medium">{permission.module}</p>
            </div>

            <div className="rounded-md border p-4">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="mt-1 font-medium capitalize">{permission.status}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
