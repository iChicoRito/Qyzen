'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { IconEdit } from '@tabler/icons-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from '@/components/ui/responsive-dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import {
  fetchPermissions,
  fetchPermissionsForRole,
  updateRoleWithPermissions,
  type PermissionRecord,
} from '@/lib/supabase/access-control'

import { statuses } from '../data/data'
import type { Role } from '../data/schema'

const editRoleFormSchema = z.object({
  roleName: z
    .string()
    .min(1, 'Role Name is required')
    .regex(/^[a-z]+(?:_[a-z]+)*$/, 'Role Name must use snake_case or lowercase'),
  description: z.string().min(1, 'Description is required'),
  status: z.enum(['active', 'inactive']),
  isSystem: z.boolean(),
  permissionStrings: z.array(z.string()),
})

type EditRoleFormData = z.infer<typeof editRoleFormSchema>

interface EditRoleModalProps {
  role: Role
  onRoleUpdated?: (currentRoleName: string, updatedRole: Role) => void
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

// EditRoleModal - edit role details and permissions
export function EditRoleModal({
  role,
  onRoleUpdated,
  trigger,
  open,
  onOpenChange,
}: EditRoleModalProps) {
  // ==================== STATE ====================
  const [internalOpen, setInternalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [permissions, setPermissions] = useState<PermissionRecord[]>([])
  const dialogOpen = open ?? internalOpen
  const setDialogOpen = onOpenChange ?? setInternalOpen

  // ==================== FORM SETUP ====================
  const form = useForm<EditRoleFormData>({
    resolver: zodResolver(editRoleFormSchema),
    defaultValues: {
      roleName: role.roleName,
      description: role.description,
      status: role.status,
      isSystem: role.isSystem,
      permissionStrings: [],
    },
  })

  // loadRoleDetails - load permissions and assigned permission values
  const loadRoleDetails = async () => {
    try {
      setIsLoading(true)
      const [permissionList, assignedPermissions] = await Promise.all([
        fetchPermissions(),
        fetchPermissionsForRole(role.roleName),
      ])

      setPermissions(permissionList)
      form.reset({
        roleName: role.roleName,
        description: role.description,
        status: role.status,
        isSystem: role.isSystem,
        permissionStrings: assignedPermissions.map((permission) => permission.permissionString),
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load role details.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (dialogOpen) {
      loadRoleDetails()
    }
  }, [dialogOpen])

  // handlePermissionCheckedChange - toggle permission checkbox value
  const handlePermissionCheckedChange = (permissionString: string, checked: boolean) => {
    const currentPermissionStrings = form.getValues('permissionStrings')

    if (checked) {
      form.setValue('permissionStrings', [...currentPermissionStrings, permissionString], {
        shouldDirty: true,
      })
      return
    }

    form.setValue(
      'permissionStrings',
      currentPermissionStrings.filter((value) => value !== permissionString),
      {
        shouldDirty: true,
      },
    )
  }

  // handleSubmit - update role and assigned permissions
  const handleSubmit = async (values: EditRoleFormData) => {
    const updatedRole: Role = {
      roleName: values.roleName,
      description: values.description,
      permissionsCount: values.permissionStrings.length,
      status: values.status,
      isSystem: values.isSystem,
    }

    try {
      setIsSubmitting(true)
      await updateRoleWithPermissions(role.roleName, updatedRole, values.permissionStrings)
      onRoleUpdated?.(role.roleName, updatedRole)
      toast.success('Role updated successfully', {
        description: `${updatedRole.roleName} has been updated.`,
      })
      setDialogOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update role.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // handleOpenChange - load or reset dialog state
  const handleOpenChange = (nextOpen: boolean) => {
    setDialogOpen(nextOpen)

    if (!nextOpen) {
      form.reset({
        roleName: role.roleName,
        description: role.description,
        status: role.status,
        isSystem: role.isSystem,
        permissionStrings: [],
      })
    }
  }

  return (
    <ResponsiveDialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {trigger ? <ResponsiveDialogTrigger asChild>{trigger}</ResponsiveDialogTrigger> : null}
      <ResponsiveDialogContent showCloseButton={false} className="gap-0 p-0" desktopClassName="sm:max-w-[620px]">
        <ResponsiveDialogHeader className="border-b px-5 py-4">
          <ResponsiveDialogTitle>Edit Role</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Update the role details and assign permissions to this role.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <ResponsiveDialogBody className="max-h-[68vh] space-y-6 px-5 py-5">
                  {/* role name field */}
                  <FormField
                    control={form.control}
                    name="roleName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role Name</FormLabel>
                        <FormControl>
                          <Input placeholder="super_admin" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* description field */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Full access to the system." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    {/* status field */}
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full cursor-pointer">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {statuses.map((status) => (
                                <SelectItem
                                  key={status.value}
                                  value={status.value}
                                  className="cursor-pointer"
                                >
                                  <div className="flex items-center">
                                    {status.icon && (
                                      <status.icon className="mr-0 h-4 w-4 text-muted-foreground" />
                                    )}
                                    {status.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* system role field */}
                    <FormField
                      control={form.control}
                      name="isSystem"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>System Role</FormLabel>
                          <div className="flex min-h-10 w-full items-center rounded-md border px-3 py-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                                className="cursor-pointer"
                              />
                            </FormControl>
                            <div className="ml-3 space-y-1 leading-none">
                              <p className="text-sm">System Role</p>
                              <p className="text-xs text-muted-foreground">
                                Mark this role as a system role.
                              </p>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* permissions field */}
                  <FormField
                    control={form.control}
                    name="permissionStrings"
                    render={() => (
                      <FormItem>
                        <FormLabel>Permissions</FormLabel>
                        <div className="space-y-3 rounded-md">
                          {isLoading ? (
                            <p className="text-sm text-muted-foreground">
                              Loading permissions...
                            </p>
                          ) : permissions.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No permissions found.</p>
                          ) : (
                            permissions.map((permission) => {
                              const isChecked = form
                                .watch('permissionStrings')
                                .includes(permission.permissionString)

                              return (
                                <div
                                  key={permission.permissionString}
                                  className="flex items-center space-x-3 rounded-md border p-3"
                                >
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={(checked) =>
                                      handlePermissionCheckedChange(
                                        permission.permissionString,
                                        Boolean(checked),
                                      )
                                    }
                                    className="cursor-pointer"
                                  />
                                  <div className="space-y-2">
                                    <p className="mb-0 text-sm font-medium">
                                      {permission.permissionName}
                                    </p>
                                    <span className="rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-xs text-blue-500">
                                      {permission.permissionString}
                                    </span>
                                    <p className="text-xs text-muted-foreground">
                                      {permission.description}
                                    </p>
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
            </ResponsiveDialogBody>

              <ResponsiveDialogFooter className="px-5 py-4">
                <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  className="w-full cursor-pointer"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="w-full cursor-pointer"
                  disabled={isSubmitting || isLoading}
                >
                  {isSubmitting ? (
                    <Spinner className="mr-0 h-4 w-4" />
                  ) : (
                    <IconEdit className="mr-0 h-4 w-4" stroke={2} />
                  )}
                  Save Changes
                </Button>
                </div>
              </ResponsiveDialogFooter>
          </form>
        </Form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
