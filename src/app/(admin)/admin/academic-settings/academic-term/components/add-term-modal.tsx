'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { IconPlus } from '@tabler/icons-react'
import { useForm } from 'react-hook-form'
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

import { semesters, statuses } from '../data/data'
import type { AcademicTerm } from '../data/schema'

const baseAcademicTermFormSchema = z.object({
  academicTermName: z.string().min(1, 'Academic Term Name is required'),
  semester: z.enum(['1st Semester', '2nd Semester']),
  academicYear: z.string().min(1, 'Academic Year is required'),
  status: z.enum(['active', 'inactive']),
})

type AcademicTermFormData = z.infer<typeof baseAcademicTermFormSchema>

interface AcademicYearOption {
  value: string
  label: string
}

interface AddAcademicTermModalProps {
  academicYearOptions: AcademicYearOption[]
  onAddAcademicTerm?: (academicTerm: AcademicTerm) => Promise<void>
  trigger?: React.ReactNode
}

// AddAcademicTermModal - add a new academic term
export function AddAcademicTermModal({
  academicYearOptions,
  onAddAcademicTerm,
  trigger,
}: AddAcademicTermModalProps) {
  // ==================== STATE ====================
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // academicTermFormSchema - validate with current academic year list
  const academicTermFormSchema = baseAcademicTermFormSchema.refine(
    (values) => academicYearOptions.some((academicYear) => academicYear.value === values.academicYear),
    {
      message: 'Selected academic year is not available.',
      path: ['academicYear'],
    }
  )

  // ==================== FORM SETUP ====================
  const form = useForm<AcademicTermFormData>({
    resolver: zodResolver(academicTermFormSchema),
    defaultValues: {
      academicTermName: '',
      semester: '1st Semester',
      academicYear: academicYearOptions[0]?.value || '',
      status: 'active',
    },
  })

  // handleSubmit - save a new academic term row
  const handleSubmit = async (values: AcademicTermFormData) => {
    const newAcademicTerm: AcademicTerm = {
      academicTermName: values.academicTermName,
      semester: values.semester,
      academicYear: values.academicYear,
      status: values.status,
    }

    try {
      setIsSubmitting(true)
      await onAddAcademicTerm?.(newAcademicTerm)
      toast.success('Academic term added successfully', {
        description: `${newAcademicTerm.academicTermName} has been created.`,
      })

      form.reset({
        academicTermName: '',
        semester: '1st Semester',
        academicYear: academicYearOptions[0]?.value || '',
        status: 'active',
      })
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add academic term.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // handleOpenChange - reset form when dialog closes
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)

    if (!nextOpen) {
      form.reset({
        academicTermName: '',
        semester: '1st Semester',
        academicYear: academicYearOptions[0]?.value || '',
        status: 'active',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default" size="sm" className="cursor-pointer">
            <IconPlus className="h-4 w-4" stroke={2} />
            Add Academic Term
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Academic Term</DialogTitle>
          <DialogDescription>
            Create a new academic term record with a term name, semester, academic year, and
            status.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* academic term name field */}
            <FormField
              control={form.control}
              name="academicTermName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Academic Term Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Prelim" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* semester field */}
            <FormField
              control={form.control}
              name="semester"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Semester</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {semesters.map((semester) => (
                        <SelectItem
                          key={semester.value}
                          value={semester.value}
                          className="cursor-pointer"
                        >
                          {semester.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* academic year field */}
            <FormField
              control={form.control}
              name="academicYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Academic Year</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue placeholder="Select academic year" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {academicYearOptions.map((academicYear) => (
                        <SelectItem
                          key={academicYear.value}
                          value={academicYear.value}
                          className="cursor-pointer"
                        >
                          {academicYear.label}
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

            <div className="flex justify-end space-x-2 pt-4">
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
                disabled={isSubmitting || academicYearOptions.length === 0}
              >
                <IconPlus className="mr-2 h-4 w-4" stroke={2} />
                {isSubmitting ? 'Creating...' : 'Create Academic Term'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
