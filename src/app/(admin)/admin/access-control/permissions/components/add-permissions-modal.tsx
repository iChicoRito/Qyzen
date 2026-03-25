'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
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
import { Textarea } from '@/components/ui/textarea'

import { actions, modules, roles, statuses } from '../data/data'
import type { Permission } from '../data/schema'

const permissionItemSchema = z.object({
  permissionName: z.string().min(1, 'Permission Name is required'),
  description: z.string().min(1, 'Description is required'),
  role: z.string().min(1, 'Role is required'),
  action: z.string().min(1, 'Action is required'),
  module: z.string().min(1, 'Module is required'),
  status: z.enum(['active', 'inactive']),
})

const permissionFormSchema = z.object({
  permissions: z.array(permissionItemSchema).min(1, 'At least one permission is required'),
})

type PermissionFormData = z.infer<typeof permissionFormSchema>

interface AddPermissionsModalProps {
  onAddPermissions?: (permissions: Permission[]) => void
  trigger?: React.ReactNode
}

const defaultPermission: Permission = {
  permissionName: '',
  description: '',
  role: 'Administrator',
  action: 'view',
  module: 'Users',
  status: 'active',
}

// AddPermissionsModal - add multiple permissions
export function AddPermissionsModal({ onAddPermissions, trigger }: AddPermissionsModalProps) {
  // ==================== STATE ====================
  const [open, setOpen] = useState(false)

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

  // handleSubmit - save new permission rows
  const handleSubmit = (values: PermissionFormData) => {
    onAddPermissions?.(values.permissions)
    toast.success('Permissions added successfully', {
      description: `${values.permissions.length} permission record(s) have been created.`,
    })

    form.reset({
      permissions: [defaultPermission],
    })
    setOpen(false)
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Add Permissions</DialogTitle>
          <DialogDescription>
            Create one or more permission records in a single process.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                      disabled={fields.length === 1}
                      className="cursor-pointer"
                    >
                      <IconTrash className="h-4 w-4" stroke={2} />
                      Remove
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

                    {/* role field */}
                    <FormField
                      control={form.control}
                      name={`permissions.${index}.role`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Role</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full cursor-pointer">
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {roles.map((role) => (
                                <SelectItem
                                  key={role.value}
                                  value={role.value}
                                  className="cursor-pointer"
                                >
                                  {role.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* description field */}
                  <FormField
                    control={form.control}
                    name={`permissions.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Allows the role to view user records." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {/* action field */}
                    <FormField
                      control={form.control}
                      name={`permissions.${index}.action`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Action</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full cursor-pointer">
                                <SelectValue placeholder="Select action" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {actions.map((action) => (
                                <SelectItem
                                  key={action.value}
                                  value={action.value}
                                  className="cursor-pointer"
                                >
                                  {action.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* module field */}
                    <FormField
                      control={form.control}
                      name={`permissions.${index}.module`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Module</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full cursor-pointer">
                                <SelectValue placeholder="Select module" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {modules.map((module) => (
                                <SelectItem
                                  key={module.value}
                                  value={module.value}
                                  className="cursor-pointer"
                                >
                                  {module.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleAddItem}
                className="cursor-pointer"
              >
                <IconPlus className="mr-2 h-4 w-4" stroke={2} />
                Add Another Permission
              </Button>

              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button type="submit" className="cursor-pointer">
                  <IconPlus className="mr-2 h-4 w-4" stroke={2} />
                  Create Permissions
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
