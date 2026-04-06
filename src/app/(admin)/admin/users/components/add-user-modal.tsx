'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { IconPlus } from '@tabler/icons-react'
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
import { fetchRoles, type RoleRecord } from '@/lib/supabase/access-control'
import type { CreateUserInput } from '@/lib/supabase/users'

import { statuses, userTypes } from '../data/data'

const addUserFormSchema = z
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

type AddUserFormData = z.infer<typeof addUserFormSchema>

interface AddUserModalProps {
  onAddUser?: (user: CreateUserInput) => Promise<void>
  trigger?: React.ReactNode
}

// AddUserModal - add a new user and assign roles
export function AddUserModal({ onAddUser, trigger }: AddUserModalProps) {
  // ==================== STATE ====================
  const [open, setOpen] = useState(false)
  const [isLoadingRoles, setIsLoadingRoles] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [roles, setRoles] = useState<RoleRecord[]>([])

  // ==================== FORM SETUP ====================
  const form = useForm<AddUserFormData>({
    resolver: zodResolver(addUserFormSchema),
    defaultValues: {
      userId: '',
      givenName: '',
      surname: '',
      email: '',
      status: 'active',
      userType: 'student',
      roleNames: [],
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
    }
  }, [open])

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

  // handleSubmit - create a new user row
  const handleSubmit = async (values: AddUserFormData) => {
    const newUser: CreateUserInput = {
      userId: values.userId,
      givenName: values.givenName,
      surname: values.surname,
      email: values.email,
      status: values.status,
      userType: values.userType,
      roleNames: values.roleNames,
    }

    try {
      setIsSubmitting(true)
      await onAddUser?.(newUser)
      toast.success('User added successfully', {
        description: `${newUser.givenName} ${newUser.surname} has been created and emailed.`,
      })
      form.reset()
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add user.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // handleOpenChange - reset form when dialog closes
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)

    if (!nextOpen) {
      form.reset()
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogTrigger asChild>
        {trigger || (
          <Button variant="default" size="sm" className="cursor-pointer">
            <IconPlus className="h-4 w-4" stroke={2} />
            Add User
          </Button>
        )}
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent showCloseButton={false} className="gap-0 p-0" desktopClassName="sm:max-w-[620px]">
        <ResponsiveDialogHeader className="border-b px-5 pt-6 pb-4">
          <ResponsiveDialogTitle>Add New User</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Create a new student or educator and assign one or more roles.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <ResponsiveDialogBody className="max-h-[68vh] space-y-6 px-5 py-5">
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
            </ResponsiveDialogBody>

              <ResponsiveDialogFooter className="px-5 pb-6">
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
                  disabled={isSubmitting || isLoadingRoles}
                >
                  {isSubmitting ? <Spinner className="mr-2 h-4 w-4" /> : null}
                  Create User
                </Button>
                </div>
              </ResponsiveDialogFooter>
          </form>
        </Form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
