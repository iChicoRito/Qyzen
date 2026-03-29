'use client'

import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { IconChevronDown, IconLoader2 as Loader2, IconPlus, IconSearch } from '@tabler/icons-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { fetchEnrollmentStudents, fetchEnrollmentSubjects, type CreateEnrollmentInput, type EnrollmentStudentOption, type EnrollmentSubjectOption } from '@/lib/supabase/enrollments'
import { addEnrollmentFormSchema, type AddEnrollmentFormSchema } from '@/lib/validations/enrollment.schema'

interface AddStudentModalProps {
  onAddEnrollment?: (input: CreateEnrollmentInput) => Promise<void>
  trigger?: React.ReactNode
}

// getStatusClassName - build badge class by status
function getStatusClassName(status: 'active' | 'inactive') {
  if (status === 'active') {
    return 'rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500'
  }

  return 'rounded-md border-0 bg-rose-500/10 px-2.5 py-0.5 text-rose-500'
}

// AddStudentModal - create enrollment rows
export function AddStudentModal({ onAddEnrollment, trigger }: AddStudentModalProps) {
  const [open, setOpen] = useState(false)
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [studentOptions, setStudentOptions] = useState<EnrollmentStudentOption[]>([])
  const [subjectOptions, setSubjectOptions] = useState<EnrollmentSubjectOption[]>([])
  const [studentSearch, setStudentSearch] = useState('')
  const [subjectSearch, setSubjectSearch] = useState('')

  const form = useForm<AddEnrollmentFormSchema>({
    resolver: zodResolver(addEnrollmentFormSchema),
    defaultValues: {
      studentIds: [],
      subjectIds: [],
      status: 'active',
    },
  })

  const loadOptions = async () => {
    try {
      setIsLoadingOptions(true)
      const [students, subjects] = await Promise.all([fetchEnrollmentStudents(), fetchEnrollmentSubjects()])
      setStudentOptions(students)
      setSubjectOptions(subjects)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load enrollment options.')
    } finally {
      setIsLoadingOptions(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadOptions()
    }
  }, [open])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)

    if (!nextOpen) {
      form.reset()
      setStudentSearch('')
      setSubjectSearch('')
    }
  }

  const handleStudentCheckedChange = (studentId: number, checked: boolean) => {
    const currentIds = form.getValues('studentIds')

    if (checked) {
      form.setValue('studentIds', [...currentIds, studentId], { shouldDirty: true, shouldValidate: true })
      return
    }

    form.setValue('studentIds', currentIds.filter((value) => value !== studentId), {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const handleSubjectCheckedChange = (subjectId: number, checked: boolean) => {
    const currentIds = form.getValues('subjectIds')

    if (checked) {
      form.setValue('subjectIds', [...currentIds, subjectId], { shouldDirty: true, shouldValidate: true })
      return
    }

    form.setValue('subjectIds', currentIds.filter((value) => value !== subjectId), {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const filteredStudents = useMemo(() => {
    const normalizedSearch = studentSearch.trim().toLowerCase()
    if (!normalizedSearch) return studentOptions
    return studentOptions.filter((student) =>
      `${student.fullName} ${student.userId}`.toLowerCase().includes(normalizedSearch)
    )
  }, [studentOptions, studentSearch])

  const filteredSubjects = useMemo(() => {
    const normalizedSearch = subjectSearch.trim().toLowerCase()
    if (!normalizedSearch) return subjectOptions
    return subjectOptions.filter((subject) =>
      `${subject.subjectCode} ${subject.subjectName} ${subject.section.name}`.toLowerCase().includes(normalizedSearch)
    )
  }, [subjectOptions, subjectSearch])

  const handleSubmit = async (values: AddEnrollmentFormSchema) => {
    try {
      setIsSubmitting(true)
      await onAddEnrollment?.(values)
      toast.success('Enrollment created successfully.')
      handleOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create enrollment.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default" size="sm" className="cursor-pointer">
            <IconPlus size={18} />
            Add Student
          </Button>
        )}
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="border-0 bg-transparent p-0 shadow-none sm:max-w-[620px]">
        <DialogHeader className="sr-only">
          <DialogTitle>Add Student Enrollment</DialogTitle>
          <DialogDescription>Enroll one or more students into one or more subjects.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <Card className="mx-auto flex max-h-[calc(100vh-2rem)] w-full max-w-[620px] flex-col overflow-hidden">
              <CardHeader className="sticky top-0 z-10 border-b bg-card">
                <CardTitle>Add Student Enrollment</CardTitle>
                <CardDescription>Enroll one or more students into one or more subjects.</CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-6 overflow-y-auto">
                <FormField
                  control={form.control}
                  name="studentIds"
                  render={() => (
                    <FormItem>
                      <FormLabel>Student Name</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button type="button" variant="outline" className="w-full cursor-pointer justify-between">
                              <span className="truncate">
                                {form.watch('studentIds').length > 0
                                  ? `${form.watch('studentIds').length} student(s) selected`
                                  : 'Select students'}
                              </span>
                              <IconChevronDown size={18} className="shrink-0" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
                          <div className="border-b p-3">
                            <div className="relative">
                              <IconSearch size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                              <Input value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} placeholder="Search student" className="pl-10" />
                            </div>
                          </div>
                          <div
                            className="max-h-72 overflow-y-auto p-3"
                            onWheelCapture={(event) => event.stopPropagation()}
                          >
                            <div className="space-y-2">
                            {isLoadingOptions ? <p className="text-sm text-muted-foreground">Loading students...</p> : null}
                            {!isLoadingOptions && filteredStudents.length === 0 ? <p className="text-sm text-muted-foreground">No students found.</p> : null}
                            {!isLoadingOptions
                              ? filteredStudents.map((student) => (
                                  <label key={student.id} className="flex cursor-pointer items-start gap-3 rounded-md border p-3">
                                    <Checkbox checked={form.watch('studentIds').includes(student.id)} onCheckedChange={(checked) => handleStudentCheckedChange(student.id, Boolean(checked))} className="mt-0.5" />
                                    <div className="space-y-1">
                                      <p className="text-sm font-medium">{student.fullName}</p>
                                      <p className="text-xs text-muted-foreground">{student.userId}</p>
                                      <Badge variant="outline" className={getStatusClassName(student.status)}>
                                        {student.status === 'active' ? 'Active' : 'Inactive'}
                                      </Badge>
                                    </div>
                                  </label>
                                ))
                              : null}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subjectIds"
                  render={() => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button type="button" variant="outline" className="w-full cursor-pointer justify-between">
                              <span className="truncate">
                                {form.watch('subjectIds').length > 0
                                  ? `${form.watch('subjectIds').length} subject(s) selected`
                                  : 'Select subjects'}
                              </span>
                              <IconChevronDown size={18} className="shrink-0" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
                          <div className="border-b p-3">
                            <div className="relative">
                              <IconSearch size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                              <Input value={subjectSearch} onChange={(event) => setSubjectSearch(event.target.value)} placeholder="Search subject" className="pl-10" />
                            </div>
                          </div>
                          <div
                            className="max-h-72 overflow-y-auto p-3"
                            onWheelCapture={(event) => event.stopPropagation()}
                          >
                            <div className="space-y-2">
                            {isLoadingOptions ? <p className="text-sm text-muted-foreground">Loading subjects...</p> : null}
                            {!isLoadingOptions && filteredSubjects.length === 0 ? <p className="text-sm text-muted-foreground">No subjects found.</p> : null}
                            {!isLoadingOptions
                              ? filteredSubjects.map((subject) => (
                                  <label key={subject.id} className="flex cursor-pointer items-start gap-3 rounded-md border p-3">
                                    <Checkbox checked={form.watch('subjectIds').includes(subject.id)} onCheckedChange={(checked) => handleSubjectCheckedChange(subject.id, Boolean(checked))} className="mt-0.5" />
                                    <div className="space-y-1">
                                      <p className="text-sm font-medium">{subject.subjectCode} - {subject.subjectName}</p>
                                      <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline" className="rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-blue-500">{subject.section.name}</Badge>
                                        <Badge variant="outline" className={getStatusClassName(subject.status)}>
                                          {subject.status === 'active' ? 'Active' : 'Inactive'}
                                        </Badge>
                                      </div>
                                    </div>
                                  </label>
                                ))
                              : null}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          <SelectItem value="active" className="cursor-pointer">Active</SelectItem>
                          <SelectItem value="inactive" className="cursor-pointer">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>

              <CardFooter className="sticky bottom-0 z-10 grid grid-cols-2 gap-2 border-t bg-card">
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="w-full cursor-pointer" disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" className="w-full cursor-pointer" disabled={isSubmitting || isLoadingOptions}>
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>Create Enrollment</>
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
