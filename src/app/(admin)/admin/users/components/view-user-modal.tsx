'use client'

import { useState } from 'react'
import { IconEye } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogDescription,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import type { User } from '../data/schema'

interface ViewUserModalProps {
  user: User
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

// ViewUserModal - view user details
export function ViewUserModal({ user, trigger, open, onOpenChange }: ViewUserModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const statusClassName =
    user.status === 'active'
      ? 'rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500'
      : 'rounded-md border-0 bg-rose-500/10 px-2.5 py-0.5 text-rose-500'

  const userTypeLabel =
    user.userType === 'educator'
      ? 'Educator'
      : user.userType === 'student'
        ? 'Student'
        : 'Admin'

  const fullName = `${user.givenName} ${user.surname}`
  const initials = `${user.givenName.charAt(0)}${user.surname.charAt(0)}`.toUpperCase()
  const isControlled = open !== undefined
  const dialogOpen = open ?? internalOpen
  const setDialogOpen = onOpenChange ?? setInternalOpen

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : !isControlled ? (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="cursor-pointer">
            <IconEye className="h-4 w-4" stroke={2} />
            View User
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[560px]">
        <DialogHeader className="px-6 pt-6 pb-4 text-left">
          <DialogTitle>{fullName}</DialogTitle>
          <DialogDescription>User information and assigned role details.</DialogDescription>
        </DialogHeader>

        <div className="border-t border-b">
          <div className="px-2 pt-2">
            <div className="h-[160px] rounded-[28px] bg-muted" />
          </div>

          <div className="px-6 pb-4">
            <div className="-mt-12 flex h-24 w-24 items-center justify-center rounded-full border-4 border-background bg-background shadow-lg">
              <span className="sr-only">{fullName}</span>
              <div className="flex h-[5.25rem] w-[5.25rem] items-center justify-center rounded-full bg-muted">
                <span className="text-xl font-semibold tracking-tight">{initials}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-start justify-between gap-4 border-b pb-6">
              <div className="min-w-0 space-y-1">
                <h2 className="font-semibold tracking-tight">{fullName}</h2>
                <p className="break-words text-sm text-muted-foreground">{user.email}</p>
              </div>
              <Badge variant="outline" className={`${statusClassName} mt-1 shrink-0`}>
                {user.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <div className="max-h-[40vh] space-y-6 overflow-y-auto py-6">
              <div className="space-y-2">
                <p className="font-semibold">User ID</p>
                <p className="text-base text-muted-foreground">{user.userId}</p>
              </div>

              <div className="space-y-3">
                <p className="font-semibold">User Type</p>
                <Badge variant="outline" className="rounded-md px-2.5 py-0.5">
                  {userTypeLabel}
                </Badge>
              </div>

              <div className="space-y-3">
                <p className="font-semibold">Assigned Roles ID</p>
                {user.roleNames.length === 0 ? (
                  <p className="text-muted-foreground">No roles assigned.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {user.roleNames.map((roleName) => (
                      <Badge
                        key={roleName}
                        variant="outline"
                        className="rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-blue-500"
                      >
                        {roleName}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
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
