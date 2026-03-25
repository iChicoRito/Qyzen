'use client'

import { IconClock, IconEye, IconInfoCircle, IconShield } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
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
import { Separator } from '@/components/ui/separator'
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
          <Button variant="outline" size="sm" className="cursor-pointer text-xs">
            <IconEye className="h-4 w-4" stroke={2} />
            View Permission
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="flex max-h-[80vh] flex-col overflow-hidden p-0 text-xs sm:max-w-md">
        <DialogHeader className="space-y-2 p-6 pb-4 text-left">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <DialogTitle className="text-xs">{permission.permissionName}</DialogTitle>
              <DialogDescription className="text-xs">Permission Information & Access Details</DialogDescription>
            </div>
            <Badge variant="outline" className={`${statusClassName} text-xs`}>
              {permission.status === 'active' ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </DialogHeader>

        <Separator />

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-6">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold">Description</h3>
              <p className="text-xs text-muted-foreground">{permission.description}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <IconClock className="h-4 w-4 text-muted-foreground" stroke={2} />
                <h3 className="text-xs font-semibold">Timeline</h3>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Created At</p>
                  <p className="text-xs">2026-03-24</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Last Updated</p>
                  <p className="text-xs">2026-03-24</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="text-xs font-semibold">Assigned Permissions</h3>
                <Badge variant="secondary" className="rounded-md px-2.5 py-0.5 text-xs">
                  1
                </Badge>
              </div>

              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {permission.module} Module
              </p>

              <div className="rounded-xl border bg-card p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <IconShield className="mt-1 h-4 w-4 text-muted-foreground" stroke={2} />
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs">
                          {permission.module.toLowerCase().replace(/\s+/g, '-')}:{
                            permission.action
                          }
                        </p>
                        <Badge variant="outline" className="rounded-md px-2.5 py-0.5 text-xs capitalize">
                          {permission.action}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{permission.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`${statusClassName} text-xs`}>
                    {permission.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-blue-500/40 bg-blue-500/5 p-4">
              <div className="flex items-start gap-3">
                <IconInfoCircle className="mt-1 h-4 w-4 text-blue-500" stroke={2} />
                <div>
                  <p className="text-xs font-medium text-blue-500">Permission Management</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Review and adjust the role, module, and action pairing in the edit section.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <DialogFooter className="p-4 sm:justify-end">
          <DialogClose asChild>
            <Button variant="outline" className="cursor-pointer text-xs">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
