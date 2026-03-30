'use client'

import { useEffect, useState } from 'react'
import { IconEye } from '@tabler/icons-react'
import { toast } from 'sonner'

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
import { fetchPermissionsForRole, type PermissionRecord } from '@/lib/supabase/access-control'

import type { Role } from '../data/schema'

interface ViewRolesModalProps {
  role: Role
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

// ViewRolesModal - view role details
export function ViewRolesModal({ role, trigger, open, onOpenChange }: ViewRolesModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [permissions, setPermissions] = useState<PermissionRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const statusClassName =
    role.status === 'active'
      ? 'rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500'
      : 'rounded-md border-0 bg-rose-500/10 px-2.5 py-0.5 text-rose-500'

  const dialogOpen = open ?? internalOpen
  const setDialogOpen = onOpenChange ?? setInternalOpen

  useEffect(() => {
    if (!dialogOpen) {
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
  }, [dialogOpen, role.roleName])

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : open === undefined ? (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="cursor-pointer">
            <IconEye className="h-4 w-4" stroke={2} />
            View Role
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[560px]">
        <DialogHeader className="px-6 pt-6 pb-4 text-left">
          <DialogTitle>{role.roleName}</DialogTitle>
          <DialogDescription>Role information and assigned permission details.</DialogDescription>
        </DialogHeader>

        <div className="max-h-[50vh] space-y-6 overflow-y-auto border-t border-b px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="font-semibold">Description</p>
              <p className="text-muted-foreground">{role.description}</p>
            </div>
            <Badge variant="outline" className={`${statusClassName} shrink-0`}>
              {role.status === 'active' ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          <div className="space-y-3">
            <p className="font-semibold">Role Type</p>
            <Badge variant="outline" className="rounded-md px-2.5 py-0.5">
              {role.isSystem ? 'System Role' : 'Custom Role'}
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <p className="font-semibold">Assigned Permissions</p>
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
