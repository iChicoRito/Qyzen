'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { IconLoader2, IconPlus } from '@tabler/icons-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

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
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button type="button" size="sm" className="cursor-pointer">
            <IconPlus size={18} />
            Add Group Chat
          </Button>
        )}
      </DialogTrigger>

      <DialogContent showCloseButton={false} className="border-0 bg-transparent p-0 shadow-none sm:max-w-[620px]">
        <DialogHeader className="sr-only">
          <DialogTitle>Create Group Chat</DialogTitle>
          <DialogDescription>Create a manual subject group chat for one of your classrooms.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <Card className="mx-auto flex max-h-[calc(100vh-2rem)] w-full max-w-[620px] flex-col overflow-hidden">
              <CardHeader className="sticky top-0 z-10 border-b bg-card">
                <CardTitle>Create Group Chat</CardTitle>
                <CardDescription>Select an educator-owned subject to create its classroom chat room.</CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-6 overflow-y-auto">
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
              </CardFooter>
            </Card>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
