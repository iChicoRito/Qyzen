'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { IconEdit, IconLoader2 as Loader2 } from '@tabler/icons-react'
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
  fetchSectionAcademicTerms,
  type AcademicTermOption,
  type SectionRecord,
  type SectionUpdateInput,
} from '@/lib/supabase/sections'
import { sectionFormSchema, type SectionFormSchema } from '@/lib/validations/section.schema'

interface EditSectionModalProps {
  section: SectionRecord
  onUpdateSection?: (section: SectionUpdateInput) => Promise<SectionRecord>
  onSectionUpdated?: (section: SectionRecord) => void
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

// EditSectionModal - update section details
export function EditSectionModal({
  section,
  onUpdateSection,
  onSectionUpdated,
  trigger,
  open: openProp,
  onOpenChange,
}: EditSectionModalProps) {
  // ==================== STATE ====================
  const [internalOpen, setInternalOpen] = useState(false)
  const [isLoadingTerms, setIsLoadingTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [academicTerms, setAcademicTerms] = useState<AcademicTermOption[]>([])
  const open = openProp ?? internalOpen

  // ==================== FORM SETUP ====================
  const form = useForm<SectionFormSchema>({
    resolver: zodResolver(sectionFormSchema),
    defaultValues: {
      sectionName: section.sectionName,
      academicTermIds: section.academicTerms.map((academicTerm) => academicTerm.id),
      status: section.status,
    },
  })

  // loadAcademicTerms - fetch academic term options
  const loadAcademicTerms = async () => {
    try {
      setIsLoadingTerms(true)
      const termList = await fetchSectionAcademicTerms()
      setAcademicTerms(termList)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load academic terms.')
    } finally {
      setIsLoadingTerms(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadAcademicTerms()
      form.reset({
        sectionName: section.sectionName,
        academicTermIds: section.academicTerms.map((academicTerm) => academicTerm.id),
        status: section.status,
      })
    }
  }, [form, open, section])

  // handleTermCheckedChange - toggle academic term selection
  const handleTermCheckedChange = (academicTermId: number, checked: boolean) => {
    const currentAcademicTermIds = form.getValues('academicTermIds')

    if (checked) {
      form.setValue('academicTermIds', [...currentAcademicTermIds, academicTermId], {
        shouldDirty: true,
        shouldValidate: true,
      })
      return
    }

    form.setValue(
      'academicTermIds',
      currentAcademicTermIds.filter((value) => value !== academicTermId),
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    )
  }

  // handleSubmit - update section row
  const handleSubmit = async (values: SectionFormSchema) => {
    try {
      setIsSubmitting(true)
      const updatedSection = await onUpdateSection?.({
        id: section.id,
        sectionName: values.sectionName.trim(),
        academicTermIds: values.academicTermIds,
        status: values.status,
      })

      if (updatedSection) {
        onSectionUpdated?.(updatedSection)
      }

      toast.success('Section updated successfully.')
      handleOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update section.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // handleOpenChange - reset form when dialog closes
  const handleOpenChange = (nextOpen: boolean) => {
    setInternalOpen(nextOpen)
    onOpenChange?.(nextOpen)

    if (!nextOpen) {
      form.reset({
        sectionName: section.sectionName,
        academicTermIds: section.academicTerms.map((academicTerm) => academicTerm.id),
        status: section.status,
      })
    }
  }

  // ==================== RENDER ====================
  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      {trigger !== null ? (
        <ResponsiveDialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm" className="cursor-pointer">
              <IconEdit size={18} />
              Edit Section
            </Button>
          )}
        </ResponsiveDialogTrigger>
      ) : null}
      <ResponsiveDialogContent showCloseButton={false} className="gap-0 p-0" desktopClassName="sm:max-w-[620px]">
        <ResponsiveDialogHeader className="border-b">
          <ResponsiveDialogTitle>Edit Section</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Update section details and academic term assignments.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <ResponsiveDialogBody className="max-h-[68vh] space-y-6">
                  {/* section name */}
                  <FormField
                    control={form.control}
                    name="sectionName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Section Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter section name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* academic terms */}
                  <FormField
                    control={form.control}
                    name="academicTermIds"
                    render={() => (
                      <FormItem>
                        <FormLabel>Academic Terms</FormLabel>
                        <div className="space-y-3">
                          {isLoadingTerms ? (
                            <p className="text-sm text-muted-foreground">Loading academic terms...</p>
                          ) : academicTerms.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No academic terms found.</p>
                          ) : (
                            academicTerms.map((academicTerm) => {
                              const isChecked = form.watch('academicTermIds').includes(academicTerm.id)

                              return (
                                <div
                                  key={academicTerm.id}
                                  className="flex items-center space-x-3 rounded-md border p-3"
                                >
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={(checked) =>
                                      handleTermCheckedChange(academicTerm.id, Boolean(checked))
                                    }
                                    className="cursor-pointer"
                                  />
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium">{academicTerm.label}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {academicTerm.name} • {academicTerm.semester}
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
                  disabled={isSubmitting || isLoadingTerms}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="mr-0 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <IconEdit size={18} className="mr-0" />
                      Save Changes
                    </>
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
