'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { IconLoader2 as Loader2, IconPlus } from '@tabler/icons-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

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
import {
  fetchSubjectSections,
  type SubjectCreateInput,
  type SubjectSectionOption,
} from '@/lib/supabase/subjects'
import { subjectFormSchema, type SubjectFormSchema } from '@/lib/validations/subject.schema'

interface AddSubjectModalProps {
  onAddSubject?: (subject: SubjectCreateInput) => Promise<void>
  trigger?: React.ReactNode
}

// AddSubjectModal - create a new subject
export function AddSubjectModal({ onAddSubject, trigger }: AddSubjectModalProps) {
  // ==================== STATE ====================
  const [open, setOpen] = useState(false)
  const [isLoadingSections, setIsLoadingSections] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sections, setSections] = useState<SubjectSectionOption[]>([])

  // ==================== FORM SETUP ====================
  const form = useForm<SubjectFormSchema>({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: {
      subjectCode: '',
      subjectName: '',
      sectionIds: [],
      status: 'active',
    },
  })

  // loadSections - fetch educator section options
  const loadSections = async () => {
    try {
      setIsLoadingSections(true)
      const sectionList = await fetchSubjectSections()
      setSections(sectionList)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load sections.')
    } finally {
      setIsLoadingSections(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadSections()
    }
  }, [open])

  // handleSectionCheckedChange - toggle selected sections
  const handleSectionCheckedChange = (sectionId: number, checked: boolean) => {
    const currentSectionIds = form.getValues('sectionIds')

    if (checked) {
      form.setValue('sectionIds', [...currentSectionIds, sectionId], {
        shouldDirty: true,
        shouldValidate: true,
      })
      return
    }

    form.setValue(
      'sectionIds',
      currentSectionIds.filter((value) => value !== sectionId),
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    )
  }

  // handleSubmit - create subject rows
  const handleSubmit = async (values: SubjectFormSchema) => {
    try {
      setIsSubmitting(true)
      await onAddSubject?.({
        subjectCode: values.subjectCode.trim(),
        subjectName: values.subjectName.trim(),
        sectionIds: values.sectionIds,
        status: values.status,
      })
      toast.success('Subject created successfully.')
      form.reset()
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create subject.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // handleOpenChange - reset form on close
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)

    if (!nextOpen) {
      form.reset()
    }
  }

  // ==================== RENDER ====================
  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogTrigger asChild>
        {trigger || (
          <Button variant="default" size="sm" className="cursor-pointer">
            <IconPlus size={18} />
            Add Subject
          </Button>
        )}
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent showCloseButton={false} className="gap-0 p-0" desktopClassName="sm:max-w-[620px]">
        <ResponsiveDialogHeader className="border-b">
          <ResponsiveDialogTitle>Add New Subject</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Create a subject and assign one or more sections.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <ResponsiveDialogBody className="max-h-[68vh] space-y-6">
                  {/* subject code */}
                  <FormField
                    control={form.control}
                    name="subjectCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter subject code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* subject name */}
                  <FormField
                    control={form.control}
                    name="subjectName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter subject name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* sections */}
                  <FormField
                    control={form.control}
                    name="sectionIds"
                    render={() => (
                      <FormItem>
                        <FormLabel>Sections</FormLabel>
                        <div className="space-y-3">
                          {isLoadingSections ? (
                            <p className="text-sm text-muted-foreground">Loading sections...</p>
                          ) : sections.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No sections found.</p>
                          ) : (
                            sections.map((section) => {
                              const isChecked = form.watch('sectionIds').includes(section.id)

                              return (
                                <div
                                  key={section.id}
                                  className="flex items-center space-x-3 rounded-md border p-3"
                                >
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={(checked) =>
                                      handleSectionCheckedChange(section.id, Boolean(checked))
                                    }
                                    className="cursor-pointer"
                                  />
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium">{section.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {section.status === 'active' ? 'Active section' : 'Inactive section'}
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

                  {/* status */}
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
                            <SelectItem value="active" className="cursor-pointer">
                              Active
                            </SelectItem>
                            <SelectItem value="inactive" className="cursor-pointer">
                              Inactive
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
            </ResponsiveDialogBody>

              <ResponsiveDialogFooter>
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
                  disabled={isSubmitting || isLoadingSections}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="mr-0 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>Create Subject</>
                  )}
                </Button>
                </div>
              </ResponsiveDialogFooter>
          </form>
        </Form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
