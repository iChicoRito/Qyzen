'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

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
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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

import { statuses } from '../data/data'
import type { Permission } from '../data/schema'

const permissionItemSchema = z.object({
  permissionName: z.string().min(1, 'Permission Name is required'),
  description: z.string().min(1, 'Description is required'),
  resource: z.string().min(1, 'Resource is required'),
  action: z.string().min(1, 'Action is required'),
  module: z.string().min(1, 'Module is required'),
  permissionString: z.string(),
  status: z.enum(['active', 'inactive']),
})

const permissionFormSchema = z.object({
  permissions: z.array(permissionItemSchema).min(1, 'At least one permission is required'),
})

type PermissionFormData = z.infer<typeof permissionFormSchema>

interface AddPermissionsModalProps {
  onAddPermissions?: (permissions: Permission[]) => Promise<void>
  trigger?: React.ReactNode
}

const defaultPermission: Permission = {
  permissionName: '',
  description: '',
  resource: '',
  action: '',
  module: '',
  permissionString: '',
  status: 'active',
}

// buildPermissionString - combine resource and action
function buildPermissionString(resource: string, action: string) {
  const normalizedResource = resource.trim().toLowerCase().replace(/\s+/g, '_')
  const normalizedAction = action.trim().toLowerCase().replace(/\s+/g, '_')

  if (!normalizedResource || !normalizedAction) {
    return ''
  }

  return `${normalizedResource}:${normalizedAction}`
}

// AddPermissionsModal - add multiple permissions
export function AddPermissionsModal({ onAddPermissions, trigger }: AddPermissionsModalProps) {
  // ==================== STATE ====================
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ==================== FORM SETUP ====================
  const form = useForm<PermissionFormData>({
    resolver: zodResolver(permissionFormSchema),
    defaultValues: {
      permissions: [defaultPermission],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'permissions',
  })

  const watchedPermissions = useWatch({
    control: form.control,
    name: 'permissions',
  })

  useEffect(() => {
    watchedPermissions?.forEach((permission, index) => {
      const permissionString = buildPermissionString(permission.resource, permission.action)

      if (permission.permissionString !== permissionString) {
        form.setValue(`permissions.${index}.permissionString`, permissionString, {
          shouldDirty: true,
          shouldValidate: false,
        })
      }
    })
  }, [form, watchedPermissions])

  // handleSubmit - save new permission rows
  const handleSubmit = async (values: PermissionFormData) => {
    try {
      setIsSubmitting(true)
      await onAddPermissions?.(values.permissions)
      toast.success('Permissions added successfully', {
        description: `${values.permissions.length} permission record(s) have been created.`,
      })

      form.reset({
        permissions: [defaultPermission],
      })
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add permissions.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // handleAddItem - append a new repeater row
  const handleAddItem = () => {
    append(defaultPermission)
  }

  // handleOpenChange - reset form when dialog closes
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)

    if (!nextOpen) {
      form.reset({
        permissions: [defaultPermission],
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default" size="sm" className="cursor-pointer">
            <IconPlus className="h-4 w-4" stroke={2} />
            Add Permission
          </Button>
        )}
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="border-0 bg-transparent p-0 shadow-none sm:max-w-[620px]">
        <DialogHeader className="sr-only">
          <DialogTitle>Add Permissions</DialogTitle>
          <DialogDescription>
            Create one or more permission records in a single process.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <Card className="mx-auto flex max-h-[calc(100vh-2rem)] w-full max-w-[620px] flex-col overflow-hidden gap-0 py-0 shadow-xl">
              <CardHeader className="sticky top-0 z-10 border-b bg-card px-5 py-4">
                <CardTitle>Add Permissions</CardTitle>
                <CardDescription>
                  Create one or more permission records in a single process.
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
                  {/* add item action */}
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddItem}
                      className="cursor-pointer"
                      disabled={isSubmitting}
                    >
                      <IconPlus className="mr-2 h-4 w-4" stroke={2} />
                      Add Another Permission
                    </Button>
                  </div>

                  {/* permission repeater */}
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="space-y-4 rounded-md border p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">Permission {index + 1}</h3>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => remove(index)}
                            disabled={fields.length === 1 || isSubmitting}
                            className="cursor-pointer"
                          >
                            <IconTrash className="h-4 w-4" stroke={2} />
                            Remove
                          </Button>
                        </div>

                        {/* permission name field */}
                        <FormField
                          control={form.control}
                          name={`permissions.${index}.permissionName`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Permission Name</FormLabel>
                              <FormControl>
                                <Input placeholder="View Users" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* description field */}
                        <FormField
                          control={form.control}
                          name={`permissions.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Allows the role to view user records."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {/* resource field */}
                          <FormField
                            control={form.control}
                            name={`permissions.${index}.resource`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Resource</FormLabel>
                                <FormControl>
                                  <Input placeholder="users" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* action field */}
                          <FormField
                            control={form.control}
                            name={`permissions.${index}.action`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Action</FormLabel>
                                <FormControl>
                                  <Input placeholder="view" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {/* module field */}
                          <FormField
                            control={form.control}
                            name={`permissions.${index}.module`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Module</FormLabel>
                                <FormControl>
                                  <Input placeholder="Users" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* status field */}
                          <FormField
                            control={form.control}
                            name={`permissions.${index}.status`}
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
                                            <status.icon className="mr-2 h-4 w-4 text-muted-foreground" />
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
                        </div>

                        {/* permission string field */}
                        <FormField
                          control={form.control}
                          name={`permissions.${index}.permissionString`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Permission String</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  readOnly
                                  placeholder="users:view"
                                  className="bg-muted"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ))}
                  </div>
              </CardContent>

              <CardFooter className="sticky bottom-0 z-10 grid grid-cols-2 gap-2 border-t bg-card px-5 py-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  className="w-full cursor-pointer"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" className="w-full cursor-pointer" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner className="mr-2 h-4 w-4" /> : null}
                  Create Permissions
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
