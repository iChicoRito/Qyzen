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
import type { Role } from '../data/schema'

interface ViewRolesModalProps {
  role: Role
  trigger?: React.ReactNode
}

// ViewRolesModal - view role details
export function ViewRolesModal({ role, trigger }: ViewRolesModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="cursor-pointer">
            <IconEye className="h-4 w-4" stroke={2} />
            View Role
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>View Role</DialogTitle>
          <DialogDescription>Review the selected role details.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border p-4">
            <p className="text-sm text-muted-foreground">Role Name</p>
            <p className="mt-1 font-medium">{role.roleName}</p>
          </div>

          <div className="rounded-md border p-4">
            <p className="text-sm text-muted-foreground">Description</p>
            <p className="mt-1 whitespace-pre-wrap">{role.description}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-md border p-4">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="mt-1 font-medium capitalize">{role.status}</p>
            </div>

            <div className="rounded-md border p-4">
              <p className="text-sm text-muted-foreground">System Role</p>
              <p className="mt-1 font-medium">{role.isSystem ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
