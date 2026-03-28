'use client'

import { IconEye, IconUser } from '@tabler/icons-react'

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
  DialogDescription,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import type { User } from '../data/schema'

interface ViewUserModalProps {
  user: User
  trigger?: React.ReactNode
}

// ViewUserModal - view user details
export function ViewUserModal({ user, trigger }: ViewUserModalProps) {
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

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="cursor-pointer">
            <IconEye className="h-4 w-4" stroke={2} />
            View User
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="border-0 bg-transparent p-0 shadow-none sm:max-w-[500px]">
        <DialogHeader className="sr-only">
          <DialogTitle>
            {user.givenName} {user.surname}
          </DialogTitle>
          <DialogDescription>User information and assigned role details.</DialogDescription>
        </DialogHeader>
        <Card className="gap-0 overflow-hidden py-0 shadow-xl">
          <div className="flex h-28 items-center justify-center border-b bg-muted">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background">
              <IconUser className="h-8 w-8 text-muted-foreground" stroke={2} />
            </div>
          </div>

          <CardHeader className="border-b px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-lg">{user.givenName} {user.surname}</CardTitle>
                <CardDescription>User information and assigned role details.</CardDescription>
              </div>
              <Badge variant="outline" className={`${statusClassName} shrink-0`}>
                {user.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardHeader>

          <div className="max-h-[32vh] overflow-y-auto">
            <CardContent className="space-y-5 px-4 pt-4 pb-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">User ID</p>
                <p className="text-muted-foreground">{user.userId}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">Email Address</p>
                <p className="break-words text-muted-foreground">{user.email}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">User Type</p>
                <Badge variant="outline" className="rounded-md px-2.5 py-0.5">
                  {userTypeLabel}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">Assigned Roles</p>
                  <Badge variant="secondary" className="rounded-md px-2.5 py-0.5">
                    {user.roleNames.length}
                  </Badge>
                </div>

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
