'use client'

import { format, isToday, isYesterday, isThisYear } from 'date-fns'
import {
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconSearch,
  IconUserScreen,
} from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
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
  isCollapsed?: boolean
  onToggleCollapsed?: () => void
  hideHeaderTitle?: boolean
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

// GroupChatConversationList - render the searchable subject chat list
export function GroupChatConversationList({
  chats,
  selectedChatId,
  searchQuery,
  onSearchQueryChange,
  onSelectChat,
  isCollapsed = false,
  onToggleCollapsed,
  hideHeaderTitle = false,
}: GroupChatConversationListProps) {
  return (
    <div className="flex h-full min-h-0 flex-col border-r bg-background">
      <div className="border-b px-4 py-4">
        <div className="flex items-center justify-between">
          {!isCollapsed && !hideHeaderTitle ? <h1 className="text-lg font-semibold">Group Chats</h1> : <div />}
          {onToggleCollapsed ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              onClick={onToggleCollapsed}
            >
              {isCollapsed ? (
                <IconLayoutSidebarLeftExpand size={18} />
              ) : (
                <IconLayoutSidebarLeftCollapse size={18} />
              )}
            </Button>
          ) : null}
        </div>

        {!isCollapsed ? (
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
        ) : null}
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
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
                isCollapsed
                  ? 'mx-auto flex w-14 items-center justify-center rounded-lg border px-0 py-3 text-left transition-colors'
                  : 'grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors',
                selectedChatId === chat.id
                  ? 'border-border bg-accent text-accent-foreground'
                  : 'border-transparent hover:bg-accent/50'
              )}
              title={chat.subjectName}
            >
              <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-secondary text-foreground">
                <IconUserScreen size={20} />
                {isCollapsed && chat.unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-medium text-white shadow-sm">
                    {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                  </span>
                ) : null}
              </div>

              {!isCollapsed ? (
                <>
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-col items-start gap-1">
                      <p className="min-w-0 truncate font-medium">{chat.subjectName}</p>
                      <Badge variant="outline" className="h-auto rounded-md px-1.5 py-0 text-xs font-normal">
                        {chat.sectionName}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex min-w-[2.75rem] flex-col items-end justify-start gap-2 overflow-hidden text-xs text-muted-foreground">
                    <span className="max-w-full whitespace-nowrap text-right">
                      {formatConversationTimestamp(chat.lastMessageAt)}
                    </span>

                    {chat.unreadCount > 0 ? (
                      <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-medium text-white shadow-sm">
                        {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </>
              ) : null}
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
