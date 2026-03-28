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
  DialogHeader,
  DialogDescription,
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
import { fetchRoles, type RoleRecord } from '@/lib/supabase/access-control'

import { statuses, userTypes } from '../data/data'
import type { User } from '../data/schema'

const editUserFormSchema = z
  .object({
    userId: z.string().min(1, 'User ID is required'),
    givenName: z.string().min(1, 'Given name is required'),
    surname: z.string().min(1, 'Surname is required'),
    email: z.string().email('A valid email is required'),
    status: z.enum(['active', 'inactive']),
    userType: z.enum(['student', 'educator']),
    roleNames: z.array(z.string()).min(1, 'Select at least one role'),
  })
  .superRefine((data, ctx) => {
    const studentPattern = /^\d{4}-\d{5}$/
    const educatorPattern = /^\d{4}-\d{4}$/

    if (data.userType === 'student' && !studentPattern.test(data.userId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['userId'],
        message: 'Student ID must use the format 1234-12345.',
      })
    }

    if (data.userType === 'educator' && !educatorPattern.test(data.userId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['userId'],
        message: 'Educator ID must use the format 1234-1234.',
      })
    }
  })

type EditUserFormData = z.infer<typeof editUserFormSchema>

interface EditUserModalProps {
  user: User
  trigger?: React.ReactNode
}

// EditUserModal - edit user details
export function EditUserModal({ user, trigger }: EditUserModalProps) {
  // ==================== STATE ====================
  const [open, setOpen] = useState(false)
  const [isLoadingRoles, setIsLoadingRoles] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [roles, setRoles] = useState<RoleRecord[]>([])

  // ==================== FORM SETUP ====================
  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues: {
      userId: user.userId,
      givenName: user.givenName,
      surname: user.surname,
      email: user.email,
      status: user.status,
      userType: user.userType === 'admin' ? 'educator' : user.userType,
      roleNames: user.roleNames,
    },
  })

  // loadRoles - fetch role options for checkboxes
  const loadRoles = async () => {
    try {
      setIsLoadingRoles(true)
      const roleList = await fetchRoles()
      setRoles(roleList)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load roles.')
    } finally {
      setIsLoadingRoles(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadRoles()
      form.reset({
        userId: user.userId,
        givenName: user.givenName,
        surname: user.surname,
        email: user.email,
        status: user.status,
        userType: user.userType === 'admin' ? 'educator' : user.userType,
        roleNames: user.roleNames,
      })
    }
  }, [form, open, user])

  // handleRoleCheckedChange - toggle selected role name
  const handleRoleCheckedChange = (roleName: string, checked: boolean) => {
    const currentRoleNames = form.getValues('roleNames')

    if (checked) {
      form.setValue('roleNames', [...currentRoleNames, roleName], {
        shouldDirty: true,
        shouldValidate: true,
      })
      return
    }

    form.setValue(
      'roleNames',
      currentRoleNames.filter((value) => value !== roleName),
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    )
  }

  // handleSubmit - save static user updates
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      await new Promise((resolve) => setTimeout(resolve, 400))
      toast.success('User updated successfully', {
        description: `${user.givenName} ${user.surname} has been updated.`,
      })
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update user.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // handleOpenChange - reset form when dialog closes
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)

    if (!nextOpen) {
      form.reset({
        userId: user.userId,
        givenName: user.givenName,
        surname: user.surname,
        email: user.email,
        status: user.status,
        userType: user.userType === 'admin' ? 'educator' : user.userType,
        roleNames: user.roleNames,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="cursor-pointer">
            <IconEdit className="h-4 w-4" stroke={2} />
            Edit User
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="border-0 bg-transparent p-0 shadow-none sm:max-w-[520px]">
        <DialogHeader className="sr-only">
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update a user record and adjust the assigned roles.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <Card className="gap-0 overflow-hidden py-0 shadow-xl">
              <CardHeader className="border-b px-5 pt-6">
                <CardTitle>Edit User</CardTitle>
                <CardDescription>
                  Update a user record and adjust the assigned roles.
                </CardDescription>
              </CardHeader>

              <div className="max-h-[55vh] overflow-y-auto">
                <CardContent className="space-y-6 px-5 py-5">
                {/* user id and given name */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User ID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={
                              form.watch('userType') === 'student' ? '2025-47263' : '2024-2260'
                            }
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="givenName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Given Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter given name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* surname and email */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="surname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Surname</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter surname" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* status and user type */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

                  <FormField
                    control={form.control}
                    name="userType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full cursor-pointer">
                              <SelectValue placeholder="Select user type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {userTypes.map((userType) => (
                              <SelectItem
                                key={userType.value}
                                value={userType.value}
                                className="cursor-pointer"
                              >
                                {userType.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* role selection */}
                <FormField
                  control={form.control}
                  name="roleNames"
                  render={() => (
                    <FormItem>
                      <FormLabel>Select Role</FormLabel>
                      <div className="space-y-3 rounded-md">
                        {isLoadingRoles ? (
                          <p className="text-sm text-muted-foreground">Loading roles...</p>
                        ) : roles.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No roles found.</p>
                        ) : (
                          roles.map((role) => {
                            const isChecked = form.watch('roleNames').includes(role.roleName)

                            return (
                              <div
                                key={role.roleName}
                                className="flex items-center space-x-3 rounded-md border p-3"
                              >
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={(checked) =>
                                    handleRoleCheckedChange(role.roleName, Boolean(checked))
                                  }
                                  className="cursor-pointer"
                                />
                                <div className="space-y-1">
                                  <p className="text-sm font-medium">{role.roleName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {role.description}
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
                </CardContent>
              </div>

              <CardFooter className="border-t px-5 pb-6">
                <div className="flex w-full justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    className="cursor-pointer"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="cursor-pointer"
                    disabled={isSubmitting || isLoadingRoles}
                  >
                    {isSubmitting ? (
                      <Spinner className="mr-2 h-4 w-4" />
                    ) : (
                      <IconEdit className="mr-2 h-4 w-4" stroke={2} />
                    )}
                    Save Changes
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
