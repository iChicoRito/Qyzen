'use client'

import { useEffect, useState } from 'react'
import { IconEye, IconShield } from '@tabler/icons-react'
import { toast } from 'sonner'

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
import { fetchPermissionsForRole, type PermissionRecord } from '@/lib/supabase/access-control'

import type { Role } from '../data/schema'

interface ViewRolesModalProps {
  role: Role
  trigger?: React.ReactNode
}

// ViewRolesModal - view role details
export function ViewRolesModal({ role, trigger }: ViewRolesModalProps) {
  const [open, setOpen] = useState(false)
  const [permissions, setPermissions] = useState<PermissionRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const statusClassName =
    role.status === 'active'
      ? 'rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500'
      : 'rounded-md border-0 bg-rose-500/10 px-2.5 py-0.5 text-rose-500'

  useEffect(() => {
    if (!open) {
      return
    }

    const loadPermissions = async () => {
      try {
        setIsLoading(true)
        const assignedPermissions = await fetchPermissionsForRole(role.roleName)
        setPermissions(assignedPermissions)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load role permissions.')
      } finally {
        setIsLoading(false)
      }
    }

    loadPermissions()
  }, [open, role.roleName])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="cursor-pointer">
            <IconEye className="h-4 w-4" stroke={2} />
            View Role
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="border-0 bg-transparent p-0 shadow-none sm:max-w-[500px]">
        <DialogHeader className="sr-only">
          <DialogTitle>{role.roleName}</DialogTitle>
          <DialogDescription>Role information and assigned permission details.</DialogDescription>
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
                <CardTitle className="text-lg">{role.roleName}</CardTitle>
                <CardDescription>
                  Role information and assigned permission details.
                </CardDescription>
              </div>
              <Badge variant="outline" className={`${statusClassName} shrink-0`}>
                {role.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardHeader>

          <div className="max-h-[32vh] overflow-y-auto">
            <CardContent className="space-y-5 px-4 pt-4 pb-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Description</p>
                <p className="text-muted-foreground">{role.description}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">Assigned Permissions</p>
                  <Badge variant="secondary" className="rounded-md px-2.5 py-0.5">
                    {permissions.length}
                  </Badge>
                </div>

                {isLoading ? (
                  <p className="text-muted-foreground">Loading assigned permissions...</p>
                ) : permissions.length === 0 ? (
                  <p className="text-muted-foreground">No permissions assigned.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {permissions.map((permission) => (
                      <Badge
                        key={permission.permissionString}
                        variant="outline"
                        className="rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-blue-500"
                      >
                        {permission.permissionString}
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
