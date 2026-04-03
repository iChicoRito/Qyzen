'use client'

import { IconArrowLeft, IconUserScreen } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { GroupChatListItem } from '@/types/group-chat'

interface GroupChatHeaderProps {
  chat: GroupChatListItem | null
  showBackButton?: boolean
  onBack?: () => void
}

// GroupChatHeader - render the active subject and section summary
export function GroupChatHeader({ chat, showBackButton = false, onBack }: GroupChatHeaderProps) {
  if (!chat) {
    return (
      <div className="flex h-16 items-center justify-center border-b px-4 text-sm text-muted-foreground">
        Select a group chat to start messaging.
      </div>
    )
  }

  return (
    <div className="flex min-h-16 items-center gap-3 border-b px-4 py-3">
      {showBackButton ? (
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={onBack}>
          <IconArrowLeft size={18} />
        </Button>
      ) : null}

      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-secondary text-foreground">
        <IconUserScreen size={20} />
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate font-semibold">{chat.subjectName}</h2>
          <Badge variant="secondary" className="rounded-md px-2 py-0 text-xs font-normal">
            {chat.sectionName}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground">
          ({chat.studentCount} Students | <span className="text-green-500">{chat.onlineStudentCount} Online</span>)
        </p>
      </div>
    </div>
  )
}
