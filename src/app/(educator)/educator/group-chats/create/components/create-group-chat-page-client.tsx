'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { IconLoader2 as Loader2, IconMessageCircleUser, IconPlus } from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
} from '@/lib/supabase/group-chats'
import { createGroupChatFormSchema, type CreateGroupChatFormSchema } from '@/lib/validations/group-chat.schema'

interface GroupChatSubjectOption {
  id: number
  subjectCode: string
  subjectName: string
  status: 'active' | 'inactive'
  section: {
    id: number
    name: string
    status: 'active' | 'inactive'
  }
}

// CreateGroupChatPageClient - render the educator manual group chat creation screen
export function CreateGroupChatPageClient() {
  // ==================== STATE ====================
  const router = useRouter()
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [subjectOptions, setSubjectOptions] = useState<GroupChatSubjectOption[]>([])

  // ==================== FORM ====================
  const form = useForm<CreateGroupChatFormSchema>({
    resolver: zodResolver(createGroupChatFormSchema),
    defaultValues: {
      subjectId: 0,
    },
  })

  // loadSubjectOptions - fetch educator-owned subject and section choices
  const loadSubjectOptions = async () => {
    try {
      setIsLoadingOptions(true)
      const nextOptions = await fetchEducatorGroupChatSubjectOptions()
      setSubjectOptions(nextOptions)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load group chat subjects.')
    } finally {
      setIsLoadingOptions(false)
    }
  }

  useEffect(() => {
    void loadSubjectOptions()
  }, [])

  // handleSubmit - create the educator group chat and return to the chat list
  const handleSubmit = async (values: CreateGroupChatFormSchema) => {
    try {
      setIsSubmitting(true)
      await createEducatorGroupChat({
        subjectId: values.subjectId,
      })
      toast.success('Group chat created successfully.')
      router.push('/educator/group-chats')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create the group chat.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ==================== RENDER ====================
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 px-4 md:px-6">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Create Group Chat</h1>
        <p className="text-sm text-muted-foreground">
          Create a dedicated educator group chat for one of your assigned subject and section pairs.
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconMessageCircleUser size={20} />
            New Group Chat
          </CardTitle>
          <CardDescription>
            Select one subject and its assigned section to create a new classroom chat room.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="subjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject and Section</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value > 0 ? String(field.value) : undefined}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={isLoadingOptions ? 'Loading options...' : 'Select subject and section'}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjectOptions.map((option) => (
                          <SelectItem key={option.id} value={String(option.id)} className="cursor-pointer">
                            {option.subjectCode} - {option.subjectName} ({option.section.name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/educator/group-chats')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || isLoadingOptions || subjectOptions.length === 0}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="mr-0 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <IconPlus size={18} />
                      Create Group Chat
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
