'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { IconPlus } from '@tabler/icons-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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

import { statuses } from '../data/data'
import type { Role } from '../data/schema'

const roleFormSchema = z.object({
  roleName: z.string().min(1, 'Role Name is required'),
  description: z.string().min(1, 'Description is required'),
  status: z.enum(['active', 'inactive']),
  isSystem: z.boolean(),
})

type RoleFormData = z.infer<typeof roleFormSchema>

interface AddRolesModalProps {
  onAddRole?: (role: Role) => void
  trigger?: React.ReactNode
}

// AddRolesModal - add a new role
export function AddRolesModal({ onAddRole, trigger }: AddRolesModalProps) {
  // ==================== STATE ====================
  const [open, setOpen] = useState(false)

  // ==================== FORM SETUP ====================
  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      roleName: '',
      description: '',
      status: 'active',
      isSystem: false,
    },
  })

  // handleSubmit - save a new role row
  const handleSubmit = (values: RoleFormData) => {
    const newRole: Role = {
      roleName: values.roleName,
      description: values.description,
      status: values.status,
      isSystem: values.isSystem,
    }

    onAddRole?.(newRole)
    toast.success('Role added successfully', {
      description: `${newRole.roleName} has been created.`,
    })

    form.reset()
    setOpen(false)
  }

  // handleOpenChange - reset form when dialog closes
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)

    if (!nextOpen) {
      form.reset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default" size="sm" className="cursor-pointer">
            <IconPlus className="h-4 w-4" stroke={2} />
            Add Role
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add Role</DialogTitle>
          <DialogDescription>
            Create a new role record with role details and status.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* role name field */}
            <FormField
              control={form.control}
              name="roleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Administrator" {...field} />
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

            {/* system role field */}
            <FormField
              control={form.control}
              name="isSystem"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                      className="cursor-pointer"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>System Role</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Mark this role for future `is_system` database implementation.
                    </p>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
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
                Create Role
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
