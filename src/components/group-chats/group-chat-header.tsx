'use client'

import { IconMenu2, IconUserScreen } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { GroupChatListItem } from '@/types/group-chat'

interface GroupChatHeaderProps {
  chat: GroupChatListItem | null
  showMenuButton?: boolean
  hasUnreadConversations?: boolean
  onOpenConversationDrawer?: () => void
}

// GroupChatHeader - render the active subject and section summary
export function GroupChatHeader({
  chat,
  showMenuButton = false,
  hasUnreadConversations = false,
  onOpenConversationDrawer,
}: GroupChatHeaderProps) {
  if (!chat) {
    return (
      <div className="flex h-16 shrink-0 items-center gap-3 border-b bg-background px-4 text-sm text-muted-foreground">
        {showMenuButton ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative h-8 w-8 md:hidden"
            onClick={onOpenConversationDrawer}
          >
            <IconMenu2 size={18} />
            {hasUnreadConversations ? (
              <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500" />
            ) : null}
          </Button>
        ) : null}

        <div className="flex-1 text-center">Select a group chat to start messaging.</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-16 shrink-0 items-center gap-3 border-b bg-background px-4 py-3">
      {showMenuButton ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 md:hidden"
          onClick={onOpenConversationDrawer}
        >
          <IconMenu2 size={18} />
          {hasUnreadConversations ? (
            <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500" />
          ) : null}
        </Button>
      ) : null}

      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-secondary text-foreground">
        <IconUserScreen size={20} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-1">
          <h2 className="min-w-0 truncate font-semibold">{chat.subjectName}</h2>
          <Badge variant="outline" className="h-auto rounded-md px-1.5 py-0 text-xs font-normal">
            {chat.sectionName}
          </Badge>
        </div>

        <p className="truncate text-sm text-muted-foreground">
          {chat.studentCount} Students • <span className="text-green-500">{chat.onlineStudentCount} Online</span>
        </p>
      </div>
    </div>
  )
}
