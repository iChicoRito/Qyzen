'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { format, isToday, isYesterday } from 'date-fns'
import { IconChecks, IconUserScreen } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { GroupChatMessage } from '@/types/group-chat'

interface GroupChatMessageListProps {
  groupChatId: number
  currentUserId: number
  messages: GroupChatMessage[]
  isLoading?: boolean
}

interface GroupedMessageDay {
  date: string
  messages: GroupChatMessage[]
}

// formatMessageTimestamp - render one message timestamp
function formatMessageTimestamp(timestamp: string) {
  return format(new Date(timestamp), 'p')
}

// formatDayLabel - render a friendly group label for one day
function formatDayLabel(dateValue: string) {
  const date = new Date(dateValue)

  if (isToday(date)) {
    return 'Today'
  }

  if (isYesterday(date)) {
    return 'Yesterday'
  }

  return format(date, 'EEEE, MMMM d')
}

// groupMessagesByDay - collect message rows under one date label
function groupMessagesByDay(messages: GroupChatMessage[]) {
  return messages.reduce<GroupedMessageDay[]>((groups, message) => {
    const dateLabel = format(new Date(message.createdAt), 'yyyy-MM-dd')
    const lastGroup = groups[groups.length - 1]

    if (lastGroup && lastGroup.date === dateLabel) {
      lastGroup.messages.push(message)
      return groups
    }

    groups.push({
      date: dateLabel,
      messages: [message],
    })

    return groups
  }, [])
}

// GroupChatMessageList - render one scrollable message thread
export function GroupChatMessageList({
  groupChatId,
  currentUserId,
  messages,
  isLoading = false,
}: GroupChatMessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement | null>(null)
  const hasLoadedInitialMessagesRef = useRef(false)
  const lastMessageIdRef = useRef<number | null>(null)
  const shouldAutoScrollRef = useRef(false)

  // resetScrollTracking - restart auto-scroll detection for one chat thread
  useEffect(() => {
    hasLoadedInitialMessagesRef.current = false
    lastMessageIdRef.current = null
    shouldAutoScrollRef.current = false
  }, [groupChatId])

  // trackMessageUpdates - detect only truly new appended messages after initial load
  useEffect(() => {
    if (isLoading) {
      return
    }

    const lastMessageId = messages[messages.length - 1]?.id ?? null

    if (!hasLoadedInitialMessagesRef.current) {
      hasLoadedInitialMessagesRef.current = true
      lastMessageIdRef.current = lastMessageId
      shouldAutoScrollRef.current = false
      return
    }

    shouldAutoScrollRef.current = Boolean(
      messages.length > 0 && lastMessageId && lastMessageIdRef.current && lastMessageId !== lastMessageIdRef.current
    )
    lastMessageIdRef.current = lastMessageId
  }, [isLoading, messages])

  // syncScrollPosition - jump to the newest message only after new message updates
  useLayoutEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]')

    if (!viewport || !shouldAutoScrollRef.current) {
      return
    }

    viewport.scrollTop = viewport.scrollHeight
    shouldAutoScrollRef.current = false
  }, [messages, groupChatId])

  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading messages...
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center px-4 text-center text-sm text-muted-foreground">
        No messages yet. Start the conversation with your educator and classmates.
      </div>
    )
  }

  const groupedMessages = groupMessagesByDay(messages)

  return (
    <ScrollArea ref={scrollAreaRef} className="min-h-0 flex-1 overflow-hidden">
      <div className="space-y-4 px-4 py-4">
        {groupedMessages.map((group) => (
          <div key={group.date}>
            <div className="flex justify-center py-2">
              <span className="rounded-md border bg-background px-3 py-1 text-xs text-muted-foreground">
                {formatDayLabel(group.date)}
              </span>
            </div>

            <div className="space-y-2">
              {group.messages.map((message, index) => {
                const isOwnMessage = message.senderUserId === currentUserId
                const previousMessage = index > 0 ? group.messages[index - 1] : null
                const showSender =
                  !isOwnMessage && (!previousMessage || previousMessage.senderUserId !== message.senderUserId)

                return (
                  <div
                    key={message.id}
                    className={cn('flex gap-3', isOwnMessage ? 'justify-end' : 'justify-start')}
                  >
                    {!isOwnMessage ? (
                      <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-secondary text-foreground">
                        <IconUserScreen size={16} />
                      </div>
                    ) : null}

                    <div
                      className={cn(
                        'flex max-w-[80%] flex-col',
                        isOwnMessage ? 'items-end' : 'items-start'
                      )}
                    >
                      {showSender ? (
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">{message.senderDisplayName}</p>
                          {message.senderRole === 'educator' ? (
                            <Badge
                              variant="outline"
                              className="border-yellow-500/30 bg-yellow-500/10 text-[11px] tracking-wide text-yellow-500"
                            >
                              EDUCATOR
                            </Badge>
                          ) : null}
                        </div>
                      ) : null}

                      <div
                        className={cn(
                          'rounded-lg px-3 py-2 text-sm',
                          isOwnMessage
                            ? 'bg-primary text-primary-foreground'
                            : message.senderRole === 'educator'
                              ? 'educator-message-bubble'
                              : 'bg-muted text-foreground'
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>

                        <div
                          className={cn(
                            'mt-2 flex items-center gap-1 text-xs',
                            isOwnMessage
                              ? 'justify-end text-primary-foreground/80'
                              : message.senderRole === 'educator'
                                ? 'educator-message-meta'
                                : 'text-muted-foreground'
                          )}
                          >
                          <span>{formatMessageTimestamp(message.createdAt)}</span>
                          {isOwnMessage && message.isSeenByOtherParticipant ? <IconChecks size={14} /> : null}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

      </div>
    </ScrollArea>
  )
}
