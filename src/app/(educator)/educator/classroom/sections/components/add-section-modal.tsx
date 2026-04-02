'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { IconPlus, IconLoader2 as Loader2 } from '@tabler/icons-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

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
import { fetchSectionAcademicTerms, type AcademicTermOption, type SectionCreateInput } from '@/lib/supabase/sections'
import { sectionFormSchema, type SectionFormSchema } from '@/lib/validations/section.schema'

interface AddSectionModalProps {
  onAddSection?: (section: SectionCreateInput) => Promise<void>
  trigger?: React.ReactNode
}

// AddSectionModal - create a new section
export function AddSectionModal({ onAddSection, trigger }: AddSectionModalProps) {
  // ==================== STATE ====================
  const [open, setOpen] = useState(false)
  const [isLoadingTerms, setIsLoadingTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [academicTerms, setAcademicTerms] = useState<AcademicTermOption[]>([])

  // ==================== FORM SETUP ====================
  const form = useForm<SectionFormSchema>({
    resolver: zodResolver(sectionFormSchema),
    defaultValues: {
      sectionName: '',
      academicTermIds: [],
      status: 'active',
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
    }
  }, [open])

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

  // handleSubmit - create a new section row
  const handleSubmit = async (values: SectionFormSchema) => {
    try {
      setIsSubmitting(true)
      await onAddSection?.({
        sectionName: values.sectionName.trim(),
        academicTermIds: values.academicTermIds,
        status: values.status,
      })
      toast.success('Section created successfully.')
      form.reset()
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create section.')
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

  // ==================== RENDER ====================
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default" size="sm" className="cursor-pointer">
            <IconPlus size={18} />
            Add Section
          </Button>
        )}
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="border-0 bg-transparent p-0 shadow-none sm:max-w-[620px]">
        <DialogHeader className="sr-only">
          <DialogTitle>Add New Section</DialogTitle>
          <DialogDescription>Create a classroom section and assign academic terms.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <Card className="mx-auto flex max-h-[calc(100vh-2rem)] w-full max-w-[620px] flex-col overflow-hidden">
              <CardHeader className="sticky top-0 z-10 border-b bg-card">
                <CardTitle>Add New Section</CardTitle>
                <CardDescription>Create a classroom section and assign academic terms.</CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-6 overflow-y-auto">
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
              </CardContent>

              <CardFooter className="sticky bottom-0 z-10 grid grid-cols-2 gap-2 border-t bg-card">
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
                    <>Create Section</>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
