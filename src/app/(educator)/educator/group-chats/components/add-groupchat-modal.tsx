'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { IconLoader2, IconPlus } from '@tabler/icons-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createEducatorGroupChat,
  fetchEducatorGroupChatSubjectOptions,
  type EducatorGroupChatSubjectOption,
} from '@/lib/supabase/group-chats'
import {
  createGroupChatFormSchema,
  type CreateGroupChatFormSchema,
} from '@/lib/validations/group-chat.schema'

import { type EducatorManagedGroupChatRow } from '../data/schema'

interface AddGroupChatModalProps {
  onGroupChatCreated?: (groupChat: EducatorManagedGroupChatRow) => void
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

// AddGroupChatModal - create one educator-owned subject group chat
export function AddGroupChatModal({
  onGroupChatCreated,
  trigger,
  open,
  onOpenChange,
}: AddGroupChatModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [subjectOptions, setSubjectOptions] = useState<EducatorGroupChatSubjectOption[]>([])
  const dialogOpen = open ?? internalOpen
  const setDialogOpen = onOpenChange ?? setInternalOpen

  const form = useForm<CreateGroupChatFormSchema>({
    resolver: zodResolver(createGroupChatFormSchema),
    defaultValues: {
      subjectId: 0,
    },
  })

  const selectedSubjectId = form.watch('subjectId')
  const selectedSubject = subjectOptions.find((option) => option.id === selectedSubjectId) || null

  const loadSubjectOptions = async () => {
    try {
      setIsLoadingOptions(true)
      const optionList = await fetchEducatorGroupChatSubjectOptions()
      setSubjectOptions(optionList)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load subject options.')
    } finally {
      setIsLoadingOptions(false)
    }
  }

  useEffect(() => {
    if (dialogOpen) {
      loadSubjectOptions()
    }
  }, [dialogOpen])

  const handleSubmit = async (values: CreateGroupChatFormSchema) => {
    try {
      setIsSubmitting(true)
      const createdGroupChat = await createEducatorGroupChat({
        subjectId: values.subjectId,
      })
      onGroupChatCreated?.(createdGroupChat)
      toast.success('Group chat created successfully.')
      form.reset({ subjectId: 0 })
      setDialogOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create the group chat.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setDialogOpen(nextOpen)

    if (!nextOpen) {
      form.reset({ subjectId: 0 })
    }
  }

  return (
    <ResponsiveDialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <ResponsiveDialogTrigger asChild>
        {trigger || (
          <Button type="button" size="sm" className="cursor-pointer">
            <IconPlus size={18} />
            Add Group Chat
          </Button>
        )}
      </ResponsiveDialogTrigger>

      <ResponsiveDialogContent showCloseButton={false} className="gap-0 p-0" desktopClassName="sm:max-w-[620px]">
        <ResponsiveDialogHeader className="border-b">
          <ResponsiveDialogTitle>Create Group Chat</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Create a manual subject group chat for one of your classrooms.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <ResponsiveDialogBody className="max-h-[68vh] space-y-6">
                <FormField
                  control={form.control}
                  name="subjectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <Select
                        value={field.value > 0 ? String(field.value) : undefined}
                        onValueChange={(value) => field.onChange(Number(value))}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full cursor-pointer">
                            <SelectValue placeholder={isLoadingOptions ? 'Loading subjects...' : 'Select subject'} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subjectOptions.map((option) => (
                            <SelectItem key={option.id} value={String(option.id)} className="cursor-pointer">
                              {option.subjectCode} - {option.subjectName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3 rounded-lg border p-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Section</p>
                    <p className="mt-1 font-medium">
                      {selectedSubject ? selectedSubject.section.name : 'Select a subject first'}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Subject Status</p>
                      <p className="mt-1 capitalize">{selectedSubject?.status || 'Unavailable'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Section Status</p>
                      <p className="mt-1 capitalize">{selectedSubject?.section.status || 'Unavailable'}</p>
                    </div>
                  </div>
                </div>
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
                  disabled={isSubmitting || isLoadingOptions || subjectOptions.length === 0}
                >
                  {isSubmitting ? (
                    <>
                      <IconLoader2 size={18} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>Create Group Chat</>
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
