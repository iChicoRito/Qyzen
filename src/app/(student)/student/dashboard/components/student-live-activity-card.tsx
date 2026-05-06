'use client'

import * as React from 'react'
import { IconBell, IconLoader2 as Loader2, IconMessageCircle, IconMessages } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { fetchGroupChatList } from '@/lib/supabase/group-chats'
import { fetchRecentNotifications, fetchUnreadNotificationCount } from '@/lib/supabase/notifications'
import type { GroupChatListItem } from '@/types/group-chat'
import type { NotificationRecord } from '@/types/notification'

// formatRelativeTime - convert timestamps into a compact relative label
function formatRelativeTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  const diffInMinutes = Math.floor((Date.now() - date.getTime()) / 60000)

  if (diffInMinutes < 1) {
    return 'just now'
  }

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)

  if (diffInHours < 24) {
    return `${diffInHours}h ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays}d ago`
}

// StudentLiveActivityCard - render recent chats and notifications
export function StudentLiveActivityCard({ currentUserId }: { currentUserId: number }) {
  const [isLoading, setIsLoading] = React.useState(true)
  const [chatList, setChatList] = React.useState<GroupChatListItem[]>([])
  const [notifications, setNotifications] = React.useState<NotificationRecord[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  // loadLiveActivity - fetch chats and notifications for the current student
  React.useEffect(() => {
    let isMounted = true

    async function loadLiveActivity() {
      try {
        setIsLoading(true)
        const [chatRows, notificationRows, unreadTotal] = await Promise.all([
          fetchGroupChatList(),
          fetchRecentNotifications(currentUserId, 5),
          fetchUnreadNotificationCount(currentUserId),
        ])

        if (!isMounted) {
          return
        }

        setChatList(chatRows)
        setNotifications(notificationRows)
        setUnreadCount(unreadTotal)
        setErrorMessage(null)
      } catch (error) {
        if (!isMounted) {
          return
        }

        const message = error instanceof Error ? error.message : 'Failed to load live activity.'
        setErrorMessage(message)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadLiveActivity()

    return () => {
      isMounted = false
    }
  }, [currentUserId])

  return (
    <Card>
      <CardHeader className="px-4 pt-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle>Live Activity</CardTitle>
            <CardDescription>Recent chats and notifications tied to your account.</CardDescription>
          </div>
          <Badge variant="outline" className="rounded-md border-border/60 bg-background px-2 py-1 text-xs">
            {unreadCount.toLocaleString()} unread
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {isLoading ? (
          <div className="flex items-center gap-2 rounded-lg border p-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading live activity...
          </div>
        ) : errorMessage ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">{errorMessage}</div>
        ) : (
          <Tabs defaultValue="chats" className="w-full">
            <TabsList className="grid h-10 w-full grid-cols-2 rounded-lg bg-muted/50 p-1">
              <TabsTrigger value="chats" className="cursor-pointer rounded-md px-3 py-2 text-sm">
                <IconMessageCircle className="mr-2 h-4 w-4" />
                Chats
              </TabsTrigger>
              <TabsTrigger value="notifications" className="cursor-pointer rounded-md px-3 py-2 text-sm">
                <IconBell className="mr-2 h-4 w-4" />
                Notifications
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chats" className="mt-4 space-y-3">
              {chatList.length > 0 ? (
                chatList.slice(0, 3).map((chat) => (
                  <div key={chat.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{chat.subjectName}</div>
                        <div className="text-sm text-muted-foreground">{chat.sectionName}</div>
                      </div>
                      <Badge variant="outline" className="rounded-md border-border/60 bg-background px-2 py-1 text-xs">
                        {chat.unreadCount.toLocaleString()} unread
                      </Badge>
                    </div>
                    <div className="mt-3 text-sm text-muted-foreground">
                      {chat.lastMessagePreview || 'No recent messages yet.'}
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <IconMessages className="h-4 w-4" />
                      {chat.participantSummary.studentCount.toLocaleString()} students
                      <span>•</span>
                      {chat.participantSummary.onlineStudentCount.toLocaleString()} online
                      <span>•</span>
                      {chat.lastMessageAt ? formatRelativeTime(chat.lastMessageAt) : 'No activity'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  No group chats found yet.
                </div>
              )}
            </TabsContent>

            <TabsContent value="notifications" className="mt-4 space-y-3">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div key={notification.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{notification.title}</div>
                        <div className="mt-1 text-sm text-muted-foreground">{notification.message}</div>
                      </div>
                      <Badge
                        className={
                          notification.isRead
                            ? 'rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-blue-500'
                            : 'rounded-md border-0 bg-yellow-500/10 px-2.5 py-0.5 text-yellow-500'
                        }
                      >
                        {notification.isRead ? 'Read' : 'New'}
                      </Badge>
                    </div>
                    <div className="mt-3 text-sm text-muted-foreground">
                      {formatRelativeTime(notification.createdAt)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  No notifications found.
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
