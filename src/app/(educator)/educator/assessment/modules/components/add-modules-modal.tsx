'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  IconCalendarEvent,
  IconChevronDown,
  IconLoader2 as Loader2,
  IconPlus,
} from '@tabler/icons-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import {
  fetchModuleSubjectOptions,
  type ModuleCreateInput,
  type ModuleSubjectOption,
} from '@/lib/supabase/modules'
import {
  getModuleCodeValue,
  moduleCodeOptions,
  moduleFormSchema,
  type ModuleFormSchema,
} from '@/lib/validations/module.schema'

interface AddModulesModalProps {
  onAddModules?: (input: ModuleCreateInput) => Promise<void>
  trigger?: React.ReactNode
}

// DatePickerField - pick a single calendar date
function DatePickerField({
  value,
  onChange,
  placeholder,
}: {
  value: Date | undefined
  onChange: (value: Date | undefined) => void
  placeholder: string
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'w-full justify-between text-left font-normal',
            !value && 'text-muted-foreground'
          )}
        >
          {value ? format(value, 'MMMM dd, yyyy') : placeholder}
          <IconCalendarEvent size={18} className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={onChange} />
      </PopoverContent>
    </Popover>
  )
}

// AddModulesModal - create one or more modules
export function AddModulesModal({ onAddModules, trigger }: AddModulesModalProps) {
  const [open, setOpen] = useState(false)
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false)
  const [subjectOptions, setSubjectOptions] = useState<ModuleSubjectOption[]>([])
  const subjectListRef = useRef<HTMLDivElement | null>(null)

  const form = useForm<ModuleFormSchema>({
    resolver: zodResolver(moduleFormSchema),
    defaultValues: {
      moduleCodeMode: 'preset',
      moduleCodePreset: moduleCodeOptions[0],
      moduleCodeManual: '',
      subjectIds: [],
      academicTermId: undefined,
      timeLimit: '',
      cheatingAttempts: '0',
      isShuffle: false,
      allowReview: false,
      allowRetake: false,
      retakeCount: '',
      allowHint: false,
      hintCount: '',
      status: 'active',
      startDate: undefined,
      endDate: undefined,
      startTime: '',
      endTime: '',
    },
  })

  const selectedSubjectIds = form.watch('subjectIds')
  const moduleCodeMode = form.watch('moduleCodeMode')
  const allowRetake = form.watch('allowRetake')
  const allowHint = form.watch('allowHint')
  const selectedSubjects = useMemo(
    () => subjectOptions.filter((option) => selectedSubjectIds.includes(option.subjectId)),
    [selectedSubjectIds, subjectOptions]
  )
  const availableAcademicTerms = useMemo(() => {
    if (selectedSubjects.length === 0) {
      return []
    }

    if (selectedSubjects.length === 1) {
      return selectedSubjects[0].academicTerms
    }

    return selectedSubjects[0].academicTerms.filter((term) =>
      selectedSubjects.every((subject) =>
        subject.academicTerms.some((subjectTerm) => subjectTerm.id === term.id)
      )
    )
  }, [selectedSubjects])

  // loadSubjectOptions - fetch available subject and section pairs
  const loadSubjectOptions = async () => {
    try {
      setIsLoadingSubjects(true)
      const options = await fetchModuleSubjectOptions()
      setSubjectOptions(options)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load subject options.')
    } finally {
      setIsLoadingSubjects(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadSubjectOptions()
    }
  }, [open])

  useEffect(() => {
    const currentAcademicTermId = form.getValues('academicTermId')

    if (
      typeof currentAcademicTermId === 'number' &&
      currentAcademicTermId > 0 &&
      availableAcademicTerms.some((term) => term.id === currentAcademicTermId)
    ) {
      return
    }

    form.setValue('academicTermId', undefined, {
      shouldDirty: false,
      shouldValidate: false,
    })
  }, [availableAcademicTerms, form])

  // handleSubjectCheckedChange - toggle selected subjects
  const handleSubjectCheckedChange = (subjectId: number, checked: boolean) => {
    const currentSubjectIds = form.getValues('subjectIds')

    if (checked) {
      form.setValue('subjectIds', [...currentSubjectIds, subjectId], {
        shouldDirty: true,
        shouldValidate: true,
      })
      return
    }

    form.setValue(
      'subjectIds',
      currentSubjectIds.filter((value) => value !== subjectId),
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    )
  }

  // handleSubjectListWheel - keep wheel scrolling inside the subject list
  const handleSubjectListWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    const container = subjectListRef.current

    if (!container) {
      return
    }

    container.scrollTop += event.deltaY
    event.preventDefault()
    event.stopPropagation()
  }

  // handleOpenChange - reset form on close
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)

    if (!nextOpen) {
      form.reset({
        moduleCodeMode: 'preset',
        moduleCodePreset: moduleCodeOptions[0],
        moduleCodeManual: '',
        subjectIds: [],
        academicTermId: undefined,
        timeLimit: '',
        cheatingAttempts: '0',
        isShuffle: false,
        allowReview: false,
        allowRetake: false,
        retakeCount: '',
        allowHint: false,
        hintCount: '',
        status: 'active',
        startDate: undefined,
        endDate: undefined,
        startTime: '',
        endTime: '',
      })
    }
  }

  // handleSubmit - create module rows
  const handleSubmit = async (values: ModuleFormSchema) => {
    const selections = subjectOptions.filter((option) => values.subjectIds.includes(option.subjectId))

    try {
      await onAddModules?.({
        moduleCode: getModuleCodeValue(values),
        selections,
        academicTermId: values.academicTermId as number,
        timeLimit: values.timeLimit.trim(),
        cheatingAttempts: Number(values.cheatingAttempts),
        isShuffle: values.isShuffle,
        allowReview: values.allowReview,
        allowRetake: values.allowRetake,
        retakeCount: values.allowRetake ? Number(values.retakeCount || '0') : 0,
        allowHint: values.allowHint,
        hintCount: values.allowHint ? Number(values.hintCount || '0') : 0,
        status: values.status,
        startDate: format(values.startDate, 'yyyy-MM-dd'),
        endDate: format(values.endDate, 'yyyy-MM-dd'),
        startTime: values.startTime,
        endTime: values.endTime,
      })
      toast.success(`${selections.length} module row${selections.length > 1 ? 's' : ''} created successfully.`)
      handleOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create modules.')
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogTrigger asChild>
        {trigger || (
          <Button variant="default" size="sm" className="cursor-pointer">
            <IconPlus size={18} />
            Add Module
          </Button>
        )}
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent showCloseButton={false} className="gap-0 p-0" desktopClassName="sm:max-w-[720px]">
        <ResponsiveDialogHeader className="border-b">
          <ResponsiveDialogTitle>Add New Module</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Create one module and save it to multiple subject rows.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <ResponsiveDialogBody className="max-h-[68vh] space-y-6">
                <FormField
                  control={form.control}
                  name="moduleCodeMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Module Code</FormLabel>
                      <div className="flex flex-col gap-3 md:flex-row">
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value)

                            if (value === 'preset') {
                              form.setValue('moduleCodeManual', '', { shouldValidate: true })
                            } else {
                              form.setValue('moduleCodePreset', undefined, { shouldValidate: true })
                            }
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full cursor-pointer md:w-[220px]">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="preset" className="cursor-pointer">
                              Dropdown Option
                            </SelectItem>
                            <SelectItem value="manual" className="cursor-pointer">
                              Manual Input
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="flex-1">
                          {moduleCodeMode === 'preset' ? (
                            <FormField
                              control={form.control}
                              name="moduleCodePreset"
                              render={({ field: moduleCodeField }) => (
                                <FormItem>
                                  <Select onValueChange={moduleCodeField.onChange} value={moduleCodeField.value}>
                                    <FormControl>
                                      <SelectTrigger className="w-full cursor-pointer">
                                        <SelectValue placeholder="Select module code" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {moduleCodeOptions.map((option) => (
                                        <SelectItem key={option} value={option} className="cursor-pointer">
                                          {option}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          ) : (
                            <FormField
                              control={form.control}
                              name="moduleCodeManual"
                              render={({ field: moduleCodeField }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input placeholder="Type module code" {...moduleCodeField} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subjectIds"
                  render={() => (
                    <FormItem>
                      <FormLabel>Select Subject Designated in the Section</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button type="button" variant="outline" className="w-full justify-between">
                            <span className="truncate text-left">
                              {selectedSubjects.length > 0
                                ? `${selectedSubjects.length} subject option${selectedSubjects.length > 1 ? 's' : ''} selected`
                                : 'Select subject and section options'}
                            </span>
                            <IconChevronDown size={18} className="text-muted-foreground" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden p-0"
                          align="start"
                          sideOffset={6}
                        >
                          <div
                            ref={subjectListRef}
                            className="max-h-64 overflow-y-auto p-4"
                            onWheel={handleSubjectListWheel}
                          >
                            <div className="space-y-2">
                              {isLoadingSubjects ? (
                                <p className="text-sm text-muted-foreground">Loading subject options...</p>
                              ) : subjectOptions.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No subjects found.</p>
                              ) : (
                                subjectOptions.map((option) => {
                                  const isChecked = selectedSubjectIds.includes(option.subjectId)

                                  return (
                                    <div
                                      key={option.subjectId}
                                      className="flex w-full items-start gap-3 rounded-md border p-3"
                                    >
                                      <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={(checked) =>
                                          handleSubjectCheckedChange(option.subjectId, Boolean(checked))
                                        }
                                        className="mt-0.5 cursor-pointer"
                                      />
                                      <div className="min-w-0 flex-1 space-y-1">
                                        <p className="text-sm font-medium uppercase">{option.subjectName}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {option.subjectCode} | {option.sectionName}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {option.academicTerms.length} academic term
                                          {option.academicTerms.length > 1 ? 's' : ''} available
                                        </p>
                                      </div>
                                    </div>
                                  )
                                })
                              )}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      {selectedSubjects.length > 0 ? (
                        <div className="rounded-md border bg-card px-4 py-2">
                          {selectedSubjects.map((option, index) => (
                            <div key={option.subjectId}>
                              <div className="py-3 text-sm">
                                <p className="font-medium uppercase">{option.subjectName}</p>
                                <p className="text-muted-foreground">
                                  {option.subjectCode} | {option.sectionName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {option.academicTerms.length} academic term
                                  {option.academicTerms.length > 1 ? 's' : ''} available
                                </p>
                              </div>
                              {index < selectedSubjects.length - 1 ? <div className="border-b" /> : null}
                            </div>
                          ))}
                        </div>
                      ) : null}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="academicTermId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academic Term</FormLabel>
                      <Select
                          onValueChange={(value) => field.onChange(Number(value))}
                        value={field.value && field.value > 0 ? String(field.value) : undefined}
                        disabled={selectedSubjects.length === 0 || availableAcademicTerms.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full cursor-pointer">
                            <SelectValue
                              placeholder={
                                selectedSubjects.length === 0
                                  ? 'Select subject and section options first'
                                  : availableAcademicTerms.length === 0
                                    ? 'No shared academic term found'
                                    : 'Select academic term'
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableAcademicTerms.map((term) => (
                            <SelectItem key={term.id} value={String(term.id)} className="cursor-pointer">
                              {term.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedSubjects.length > 1 && availableAcademicTerms.length > 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Only shared academic terms are shown for multiple selected subject options.
                        </p>
                      ) : null}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timeLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Limit</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter time limit" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isShuffle"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-md border p-4">
                      <div className="space-y-1">
                        <FormLabel>Shuffle</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Enable shuffle for the selected modules.
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="cursor-pointer"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="allowReview"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-md border p-4">
                      <div className="space-y-1">
                        <FormLabel>Allow Review</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Let students review their answers after submission.
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="cursor-pointer"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="allowRetake"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-md border p-4">
                      <div className="space-y-1">
                        <FormLabel>Allow Retake</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Allow students to submit additional assessment attempts.
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked)

                            if (!checked) {
                              form.setValue('retakeCount', '', {
                                shouldDirty: true,
                                shouldValidate: false,
                              })
                            }
                          }}
                          className="cursor-pointer"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {allowRetake ? (
                  <FormField
                    control={form.control}
                    name="retakeCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Retake Count</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="Enter number of allowed retakes"
                            value={field.value ?? ''}
                            onChange={(event) => {
                              const nextValue = event.target.value.replace(/\D/g, '')
                              field.onChange(nextValue)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}

                <FormField
                  control={form.control}
                  name="allowHint"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-md border p-4">
                      <div className="space-y-1">
                        <FormLabel>Allow Hint</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Allow random answer hints during the student assessment.
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked)

                            if (!checked) {
                              form.setValue('hintCount', '', {
                                shouldDirty: true,
                                shouldValidate: false,
                              })
                            }
                          }}
                          className="cursor-pointer"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {allowHint ? (
                  <FormField
                    control={form.control}
                    name="hintCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hint Count</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="Enter number of hints"
                            value={field.value ?? ''}
                            onChange={(event) => {
                              const nextValue = event.target.value.replace(/\D/g, '')
                              field.onChange(nextValue)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
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
                  <FormField
                    control={form.control}
                    name="cheatingAttempts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cheating Attempts</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={field.value ?? ''}
                            onChange={(event) => {
                              const nextValue = event.target.value.replace(/\D/g, '')
                              field.onChange(nextValue)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <DatePickerField
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select start date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <DatePickerField
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select end date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
            </ResponsiveDialogBody>

              <ResponsiveDialogFooter>
                <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  className="w-full cursor-pointer"
                  disabled={form.formState.isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="w-full cursor-pointer"
                  disabled={form.formState.isSubmitting || isLoadingSubjects}
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 size={18} className="mr-0 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>Create Module</>
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
