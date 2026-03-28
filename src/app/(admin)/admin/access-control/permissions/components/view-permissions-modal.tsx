'use client'

import { IconEye, IconShield } from '@tabler/icons-react'

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

import type { Permission } from '../data/schema'

interface ViewPermissionsModalProps {
  permission: Permission
  trigger?: React.ReactNode
}

// ViewPermissionsModal - view permission details
export function ViewPermissionsModal({ permission, trigger }: ViewPermissionsModalProps) {
  const statusClassName =
    permission.status === 'active'
      ? 'rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500'
      : 'rounded-md border-0 bg-rose-500/10 px-2.5 py-0.5 text-rose-500'

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
      <DialogContent className="border-0 bg-transparent p-0 shadow-none sm:max-w-[500px]">
        <DialogHeader className="sr-only">
          <DialogTitle>{permission.permissionName}</DialogTitle>
          <DialogDescription>
            Permission information and access details.
          </DialogDescription>
        </DialogHeader>

        <Card className="gap-0 overflow-hidden py-0 shadow-xl">
          <div className="flex h-28 items-center justify-center border-b bg-muted">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background">
              <IconShield className="h-8 w-8 text-muted-foreground" stroke={2} />
            </div>
          </div>

          <CardHeader className="border-b px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-lg">{permission.permissionName}</CardTitle>
                <CardDescription>Permission information and access details.</CardDescription>
              </div>
              <Badge variant="outline" className={`${statusClassName} shrink-0`}>
                {permission.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardHeader>

          <div className="max-h-[32vh] overflow-y-auto">
            <CardContent className="space-y-5 px-4 pt-4 pb-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Description</p>
                <p className="text-muted-foreground">{permission.description}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">Permission String</p>
                <Badge
                  variant="outline"
                  className="rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-blue-500"
                >
                  {permission.permissionString}
                </Badge>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">Module</p>
                <p className="text-muted-foreground">{permission.module}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Resource</p>
                  <p className="text-muted-foreground">{permission.resource}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">Action</p>
                  <p className="text-muted-foreground">{permission.action}</p>
                </div>
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
