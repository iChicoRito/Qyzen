'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  IconCalendarEvent,
  IconChevronDown,
  IconEdit,
  IconLoader2 as Loader2,
} from '@tabler/icons-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
  type ModuleRecord,
  type ModuleSubjectOption,
  type ModuleUpdateInput,
} from '@/lib/supabase/modules'
import {
  getModuleCodeValue,
  moduleCodeOptions,
  moduleFormSchema,
  type ModuleFormSchema,
} from '@/lib/validations/module.schema'

interface EditModulesModalProps {
  module: ModuleRecord
  onUpdateModule?: (input: ModuleUpdateInput) => Promise<ModuleRecord>
  onModuleUpdated?: (module: ModuleRecord) => void
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

// getDefaultFormValues - build edit form defaults
function getDefaultFormValues(
  module: ModuleRecord,
  subjectOptions: ModuleSubjectOption[]
): ModuleFormSchema {
  const isPresetCode = moduleCodeOptions.includes(module.moduleCode as (typeof moduleCodeOptions)[number])
  const matchingOption = subjectOptions.find((option) => option.subjectId === module.subjectId)

  return {
    moduleCodeMode: isPresetCode ? 'preset' : 'manual',
    moduleCodePreset: isPresetCode ? module.moduleCode : undefined,
    moduleCodeManual: isPresetCode ? '' : module.moduleCode,
    subjectIds: matchingOption ? [matchingOption.subjectId] : [module.subjectId],
    academicTermId: module.termId,
    timeLimit: module.timeLimit,
    cheatingAttempts: String(module.cheatingAttempts),
    isShuffle: module.isShuffle,
    status: module.status,
    startDate: parseISO(module.startDate),
    endDate: parseISO(module.endDate),
    startTime: module.startTime,
    endTime: module.endTime,
  }
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

// EditModulesModal - update one module row
export function EditModulesModal({
  module,
  onUpdateModule,
  onModuleUpdated,
  trigger,
  open: openProp,
  onOpenChange,
}: EditModulesModalProps) {
  // ==================== STATE ====================
  const [internalOpen, setInternalOpen] = useState(false)
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [subjectOptions, setSubjectOptions] = useState<ModuleSubjectOption[]>([])
  const subjectListRef = useRef<HTMLDivElement | null>(null)
  const open = openProp ?? internalOpen

  // ==================== FORM SETUP ====================
  const form = useForm<ModuleFormSchema>({
    resolver: zodResolver(moduleFormSchema),
    defaultValues: {
      moduleCodeMode: 'preset',
      moduleCodePreset: moduleCodeOptions[0],
      moduleCodeManual: '',
      subjectIds: [module.subjectId],
      academicTermId: module.termId,
      timeLimit: module.timeLimit,
      cheatingAttempts: String(module.cheatingAttempts),
      isShuffle: module.isShuffle,
      status: module.status,
      startDate: parseISO(module.startDate),
      endDate: parseISO(module.endDate),
      startTime: module.startTime,
      endTime: module.endTime,
    },
  })

  const selectedSubjectIds = form.watch('subjectIds')
  const moduleCodeMode = form.watch('moduleCodeMode')
  const selectedSubjects = useMemo(
    () => subjectOptions.filter((option) => selectedSubjectIds.includes(option.subjectId)),
    [selectedSubjectIds, subjectOptions]
  )
  const availableAcademicTerms = useMemo(() => {
    if (!selectedSubjects[0]) {
      return []
    }

    return selectedSubjects[0].academicTerms
  }, [selectedSubjects])

  // loadSubjectOptions - fetch available subject and section pairs
  const loadSubjectOptions = async () => {
    try {
      setIsLoadingSubjects(true)
      const options = await fetchModuleSubjectOptions()
      setSubjectOptions(options)
      form.reset(getDefaultFormValues(module, options))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load subject options.')
    } finally {
      setIsLoadingSubjects(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadSubjectOptions()
      return
    }

    form.reset(getDefaultFormValues(module, subjectOptions))
  }, [form, module, open])

  useEffect(() => {
    const currentAcademicTermId = form.getValues('academicTermId')

    if (
      currentAcademicTermId > 0 &&
      availableAcademicTerms.some((term) => term.id === currentAcademicTermId)
    ) {
      return
    }

    form.setValue('academicTermId', availableAcademicTerms[0]?.id, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }, [availableAcademicTerms, form])

  // handleSubjectCheckedChange - switch selected subject option
  const handleSubjectCheckedChange = (subjectId: number, checked: boolean) => {
    if (checked) {
      form.setValue('subjectIds', [subjectId], {
        shouldDirty: true,
        shouldValidate: true,
      })
      return
    }

    form.setValue('subjectIds', [], {
      shouldDirty: true,
      shouldValidate: true,
    })
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
    setInternalOpen(nextOpen)
    onOpenChange?.(nextOpen)

    if (!nextOpen) {
      form.reset(getDefaultFormValues(module, subjectOptions))
    }
  }

  // handleSubmit - update module row
  const handleSubmit = async (values: ModuleFormSchema) => {
    const selection = subjectOptions.find((option) => option.subjectId === values.subjectIds[0])

    if (!selection) {
      toast.error('Select one subject and section option.')
      return
    }

    try {
      setIsSubmitting(true)
      const updatedModule = await onUpdateModule?.({
        id: module.id,
        moduleCode: getModuleCodeValue(values),
        selection,
        academicTermId: values.academicTermId,
        timeLimit: values.timeLimit.trim(),
        cheatingAttempts: Number(values.cheatingAttempts),
        isShuffle: values.isShuffle,
        status: values.status,
        startDate: format(values.startDate, 'yyyy-MM-dd'),
        endDate: format(values.endDate, 'yyyy-MM-dd'),
        startTime: values.startTime,
        endTime: values.endTime,
      })

      if (updatedModule) {
        onModuleUpdated?.(updatedModule)
      }

      toast.success('Module updated successfully.')
      handleOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update module.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ==================== RENDER ====================
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger !== null ? (
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm" className="cursor-pointer">
              <IconEdit size={18} />
              Edit Module
            </Button>
          )}
        </DialogTrigger>
      ) : null}
      <DialogContent
        showCloseButton={false}
        className="border-0 bg-transparent p-0 shadow-none sm:max-w-[720px]"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Edit Module</DialogTitle>
          <DialogDescription>Update the selected module details.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <Card className="mx-auto flex max-h-[calc(100vh-2rem)] w-full max-w-[720px] flex-col overflow-hidden">
              <CardHeader className="sticky top-0 z-10 border-b bg-card">
                <CardTitle>Edit Module</CardTitle>
                <CardDescription>Update the selected module details.</CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-6 overflow-y-auto mb-3">
                {/* module code */}
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
                                  <Select
                                    onValueChange={moduleCodeField.onChange}
                                    value={moduleCodeField.value}
                                  >
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

                {/* subject option */}
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
                              {selectedSubjects[0]
                                ? `${selectedSubjects[0].subjectName} | ${selectedSubjects[0].sectionName}`
                                : 'Select subject and section option'}
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
                      {selectedSubjects[0] ? (
                        <div className="rounded-md border bg-card px-4 py-2">
                          <div className="py-3 text-sm">
                            <p className="font-medium uppercase">{selectedSubjects[0].subjectName}</p>
                            <p className="text-muted-foreground">
                              {selectedSubjects[0].subjectCode} | {selectedSubjects[0].sectionName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {selectedSubjects[0].academicTerms.length} academic term
                              {selectedSubjects[0].academicTerms.length > 1 ? 's' : ''} available
                            </p>
                          </div>
                        </div>
                      ) : null}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* academic term */}
                <FormField
                  control={form.control}
                  name="academicTermId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academic Term</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(Number(value))}
                        value={field.value > 0 ? String(field.value) : undefined}
                        disabled={selectedSubjects.length === 0 || availableAcademicTerms.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full cursor-pointer">
                            <SelectValue
                              placeholder={
                                selectedSubjects.length === 0
                                  ? 'Select subject and section option first'
                                  : availableAcademicTerms.length === 0
                                    ? 'No academic term found'
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* time limit */}
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

                {/* shuffle */}
                <FormField
                  control={form.control}
                  name="isShuffle"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-md border p-4">
                      <div className="space-y-1">
                        <FormLabel>Shuffle</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Enable shuffle for this module.
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

                {/* status and cheating attempts */}
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

                {/* dates */}
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

                {/* times */}
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
                  disabled={isSubmitting || isLoadingSubjects}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <IconEdit size={18} className="mr-2" />
                      Save Changes
                    </>
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
