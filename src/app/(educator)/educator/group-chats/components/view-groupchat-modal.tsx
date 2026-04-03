'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { IconEye, IconMessages } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

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
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : !isControlled ? (
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="cursor-pointer">
            <IconEye size={18} />
            View Group Chat
          </Button>
        </DialogTrigger>
      ) : null}

      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[560px]">
        <DialogHeader className="px-6 pt-6 pb-4 text-left">
          <DialogTitle>{groupChat.subjectName}</DialogTitle>
          <DialogDescription>Group chat details for the selected classroom room.</DialogDescription>
        </DialogHeader>

        <div className="max-h-[55vh] space-y-6 overflow-y-auto border-t border-b px-6 py-4">
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
        </div>

        <DialogFooter className="px-6 py-4 sm:justify-start">
          <Button asChild type="button" className="cursor-pointer">
            <Link href="/educator/group-chats">
              <IconMessages size={18} />
              Open Live Chat
            </Link>
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="cursor-pointer">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
