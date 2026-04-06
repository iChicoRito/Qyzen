'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { IconEye, IconMessages } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from '@/components/ui/responsive-dialog'

import { type EducatorManagedGroupChatRow } from '../data/schema'

interface ViewGroupChatModalProps {
  groupChat: EducatorManagedGroupChatRow
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

// ViewGroupChatModal - show educator-owned group chat details
export function ViewGroupChatModal({
  groupChat,
  trigger,
  open,
  onOpenChange,
}: ViewGroupChatModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const dialogOpen = open ?? internalOpen
  const setDialogOpen = onOpenChange ?? setInternalOpen
  const createdAtLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(groupChat.createdAt)),
    [groupChat.createdAt]
  )

  return (
    <ResponsiveDialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger ? (
        <ResponsiveDialogTrigger asChild>{trigger}</ResponsiveDialogTrigger>
      ) : !isControlled ? (
        <ResponsiveDialogTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="cursor-pointer">
            <IconEye size={18} />
            View Group Chat
          </Button>
        </ResponsiveDialogTrigger>
      ) : null}

      <ResponsiveDialogContent className="gap-0 p-0" desktopClassName="sm:max-w-[560px]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{groupChat.subjectName}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Group chat details for the selected classroom room.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="max-h-[60vh] space-y-6 border-t border-b">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <p className="font-semibold">Subject</p>
              <p className="text-muted-foreground">{groupChat.subjectName}</p>
            </div>
            <Badge variant="outline" className="rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-blue-500">
              {groupChat.sectionName}
            </Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 rounded-lg border p-4">
              <p className="text-sm font-medium text-muted-foreground">Students</p>
              <p className="text-2xl font-bold">{groupChat.studentCount}</p>
            </div>
            <div className="space-y-2 rounded-lg border p-4">
              <p className="text-sm font-medium text-muted-foreground">Online Students</p>
              <p className="text-2xl font-bold text-green-500">{groupChat.onlineStudentCount}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-semibold">Created At</p>
            <p className="text-muted-foreground">{createdAtLabel}</p>
          </div>

          <div className="space-y-2">
            <p className="font-semibold">Identifiers</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="rounded-md px-2.5 py-0.5">
                Chat #{groupChat.id}
              </Badge>
              <Badge variant="secondary" className="rounded-md px-2.5 py-0.5">
                Subject #{groupChat.subjectId}
              </Badge>
              <Badge variant="secondary" className="rounded-md px-2.5 py-0.5">
                Section #{groupChat.sectionId}
              </Badge>
            </div>
          </div>
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter className="sm:justify-start">
          <Button asChild type="button" className="cursor-pointer">
            <Link href="/educator/group-chats">
              <IconMessages size={18} />
              Open Live Chat
            </Link>
          </Button>
          <ResponsiveDialogClose asChild>
            <Button type="button" variant="outline" className="cursor-pointer">
              Close
            </Button>
          </ResponsiveDialogClose>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
