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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Academic Year</DialogTitle>
          <DialogDescription>
            Create a new academic year record with an academic year and status.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
              <Button type="submit" className="cursor-pointer" disabled={isSubmitting}>
                <IconPlus className="mr-2 h-4 w-4" stroke={2} />
                {isSubmitting ? 'Creating...' : 'Create Academic Year'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
