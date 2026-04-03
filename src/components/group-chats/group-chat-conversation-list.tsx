'use client'

import { format, isToday, isYesterday, isThisYear } from 'date-fns'
import {
  IconChevronRight,
  IconSearch,
  IconUserScreen,
} from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { GroupChatListItem } from '@/types/group-chat'

interface GroupChatConversationListProps {
  chats: GroupChatListItem[]
  selectedChatId: number | null
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  onSelectChat: (chatId: number) => void
}

// formatConversationTimestamp - render list timestamps in a compact chat-friendly format
function formatConversationTimestamp(timestamp: string | null) {
  if (!timestamp) {
    return ''
  }

  const date = new Date(timestamp)

  if (isToday(date)) {
    return format(date, 'p')
  }

  if (isYesterday(date)) {
    return 'Yesterday'
  }

  if (isThisYear(date)) {
    return format(date, 'MMM d')
  }

  return format(date, 'MM/dd/yy')
}

// buildConversationPreview - show a friendly preview line for the latest message
function buildConversationPreview(chat: GroupChatListItem) {
  if (!chat.lastMessagePreview) {
    return 'No messages yet.'
  }

  if (!chat.lastMessageSenderDisplayName || !chat.lastMessageSenderUserId) {
    return chat.lastMessagePreview
  }

  return `${chat.lastMessageSenderDisplayName}: ${chat.lastMessagePreview}`
}

// GroupChatConversationList - render the searchable subject chat list
export function GroupChatConversationList({
  chats,
  selectedChatId,
  searchQuery,
  onSearchQueryChange,
  onSelectChat,
}: GroupChatConversationListProps) {
  return (
    <div className="flex h-full min-h-0 flex-col border-r bg-background">
      <div className="border-b px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Group Chats</h1>
        </div>

        <div className="relative mt-3">
          <IconSearch
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Search conversations..."
            className="pl-10"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {chats.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No group chats found.
            </div>
          ) : null}

          {chats.map((chat) => (
            <button
              key={chat.id}
              type="button"
              onClick={() => onSelectChat(chat.id)}
              className={cn(
                'flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors',
                selectedChatId === chat.id
                  ? 'border-border bg-accent text-accent-foreground'
                  : 'border-transparent hover:bg-accent/50'
              )}
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-secondary text-foreground">
                <IconUserScreen size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{chat.subjectName}</p>
                      <Badge variant="secondary" className="rounded-md px-2 py-0 text-xs font-normal">
                        {chat.sectionName}
                      </Badge>
                    </div>

                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {buildConversationPreview(chat)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 text-xs text-muted-foreground">
                    <span className="whitespace-nowrap">
                      {formatConversationTimestamp(chat.lastMessageAt)}
                    </span>

                    {chat.unreadCount > 0 ? (
                      <span className="inline-flex min-w-5 items-center justify-center rounded-md bg-blue-500 px-1.5 py-0.5 text-xs text-white">
                        {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <IconChevronRight size={16} className="mt-1 hidden text-muted-foreground sm:block" />
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
