'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { IconPlus } from '@tabler/icons-react'
import { useForm } from 'react-hook-form'
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

import { statuses } from '../data/data'
import type { AcademicYear } from '../data/schema'

const academicYearFormSchema = z.object({
  academicYear: z
    .string()
    .regex(/^\d{4}\s-\s\d{4}$/, 'Academic Year must use the format YYYY - YYYY'),
  status: z.enum(['active', 'inactive']),
})

type AcademicYearFormData = z.infer<typeof academicYearFormSchema>

interface AddAcademicYearModalProps {
  onAddAcademicYear?: (academicYear: AcademicYear) => Promise<void>
  trigger?: React.ReactNode
}

// AddAcademicYearModal - add a new academic year
export function AddAcademicYearModal({ onAddAcademicYear, trigger }: AddAcademicYearModalProps) {
  // ==================== STATE ====================
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ==================== FORM SETUP ====================
  const form = useForm<AcademicYearFormData>({
    resolver: zodResolver(academicYearFormSchema),
    defaultValues: {
      academicYear: '',
      status: 'active',
    },
  })

  // handleSubmit - save a new academic year row
  const handleSubmit = async (values: AcademicYearFormData) => {
    const newAcademicYear: AcademicYear = {
      academicYear: values.academicYear,
      status: values.status,
    }

    try {
      setIsSubmitting(true)
      await onAddAcademicYear?.(newAcademicYear)
      toast.success('Academic year added successfully', {
        description: `${newAcademicYear.academicYear} has been created.`,
      })

      form.reset()
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add academic year.')
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default" size="sm" className="cursor-pointer">
            <IconPlus className="h-4 w-4" stroke={2} />
            Add Academic Year
          </Button>
        )}
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="border-0 bg-transparent p-0 shadow-none sm:max-w-[620px]">
        <DialogHeader className="sr-only">
          <DialogTitle>Add Academic Year</DialogTitle>
          <DialogDescription>
            Create a new academic year record with an academic year and status.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <Card className="mx-auto flex max-h-[calc(100vh-2rem)] w-full max-w-[620px] flex-col overflow-hidden gap-0 py-0 shadow-xl">
              <CardHeader className="sticky top-0 z-10 border-b bg-card px-5 py-4">
                <CardTitle>Add Academic Year</CardTitle>
                <CardDescription>
                  Create a new academic year record with an academic year and status.
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
            {/* academic year field */}
            <FormField
              control={form.control}
              name="academicYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Academic Year</FormLabel>
                  <FormControl>
                    <Input placeholder="2026 - 2027" {...field} />
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
              {isSubmitting ? <Spinner className="mr-0 h-4 w-4" /> : null}
              Create Academic Year
            </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
