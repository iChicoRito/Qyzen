'use client'

import * as React from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  IconArrowRight,
  IconBook2,
  IconChecklist,
  IconFileImport,
  IconLoader2,
  IconNotification,
  IconRefresh,
  IconTrash,
  IconUserCheck,
  IconUserMinus,
  IconUserPlus,
} from '@tabler/icons-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useIsMobile } from '@/hooks/use-mobile'
import type { AppRole } from '@/lib/auth/auth-context'
import { createClient } from '@/lib/supabase/client'
import {
  fetchRecentNotifications,
  fetchUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/lib/supabase/notifications'
import { cn } from '@/lib/utils'
import type {
  NotificationEventType,
  NotificationMetadata,
  NotificationRecord,
} from '@/types/notification'

interface NotificationBellProps {
  role?: AppRole
  userId?: number
}

interface NotificationToneStyles {
  avatar: string
}

interface NotificationVisualConfig {
  icon: React.ComponentType<{ className?: string }>
  eventLabel: string
  tone: keyof typeof notificationToneStyles
}

interface NotificationDetailItem {
  label: string
  value: string
}

const notificationToneStyles = {
  blue: {
    avatar: 'bg-blue-500/10 text-blue-500',
  },
  green: {
    avatar: 'bg-green-500/10 text-green-500',
  },
  yellow: {
    avatar: 'bg-yellow-500/10 text-yellow-500',
  },
  rose: {
    avatar: 'bg-rose-500/10 text-rose-500',
  },
} satisfies Record<string, NotificationToneStyles>

const notificationVisualMap: Record<NotificationEventType, NotificationVisualConfig> = {
  module_created: {
    icon: IconBook2,
    eventLabel: 'Module Created',
    tone: 'green',
  },
  module_updated: {
    icon: IconRefresh,
    eventLabel: 'Module Updated',
    tone: 'yellow',
  },
  module_deleted: {
    icon: IconTrash,
    eventLabel: 'Module Removed',
    tone: 'rose',
  },
  learning_material_uploaded: {
    icon: IconFileImport,
    eventLabel: 'Learning Material Uploaded',
    tone: 'blue',
  },
  learning_material_deleted: {
    icon: IconTrash,
    eventLabel: 'Learning Material Removed',
    tone: 'rose',
  },
  quiz_created: {
    icon: IconChecklist,
    eventLabel: 'Quiz Created',
    tone: 'green',
  },
  quiz_uploaded: {
    icon: IconFileImport,
    eventLabel: 'Quiz Uploaded',
    tone: 'blue',
  },
  quiz_updated: {
    icon: IconRefresh,
    eventLabel: 'Quiz Updated',
    tone: 'yellow',
  },
  quiz_deleted: {
    icon: IconTrash,
    eventLabel: 'Quiz Removed',
    tone: 'rose',
  },
  enrollment_created: {
    icon: IconUserPlus,
    eventLabel: 'Enrollment Added',
    tone: 'green',
  },
  enrollment_updated: {
    icon: IconUserCheck,
    eventLabel: 'Enrollment Updated',
    tone: 'blue',
  },
  enrollment_deleted: {
    icon: IconUserMinus,
    eventLabel: 'Enrollment Removed',
    tone: 'rose',
  },
  retake_updated: {
    icon: IconRefresh,
    eventLabel: 'Retake Updated',
    tone: 'yellow',
  },
  quiz_submitted: {
    icon: IconChecklist,
    eventLabel: 'Quiz Submitted',
    tone: 'blue',
  },
}

// formatNotificationTime - render a relative timestamp for each notification row
function formatNotificationTime(createdAt: string) {
  return formatDistanceToNow(new Date(createdAt), { addSuffix: true })
}

// getNotificationDetails - derive structured metadata rows for the detail view
function getNotificationDetails(metadata: NotificationMetadata | null): NotificationDetailItem[] {
  if (!metadata) {
    return []
  }

  const detailItems: NotificationDetailItem[] = []

  if (metadata.moduleCode) {
    detailItems.push({ label: 'Module', value: metadata.moduleCode })
  }

  if (metadata.subjectName) {
    detailItems.push({ label: 'Subject', value: metadata.subjectName })
  }

  if (metadata.sectionName) {
    detailItems.push({ label: 'Section', value: metadata.sectionName })
  }

  if (metadata.studentName) {
    detailItems.push({ label: 'Student', value: metadata.studentName })
  }

  if (metadata.fileName) {
    detailItems.push({ label: 'File', value: metadata.fileName })
  }

  if (typeof metadata.fileCount === 'number') {
    detailItems.push({
      label: 'File Count',
      value: String(metadata.fileCount),
    })
  }

  if (typeof metadata.questionCount === 'number') {
    detailItems.push({
      label: 'Question Count',
      value: String(metadata.questionCount),
    })
  }

  if (typeof metadata.retakeCount === 'number') {
    detailItems.push({
      label: 'Retake Count',
      value: String(metadata.retakeCount),
    })
  }

  if (metadata.enrollmentStatus) {
    detailItems.push({
      label: 'Enrollment Status',
      value: metadata.enrollmentStatus,
    })
  }

  return detailItems
}

// NotificationRow - render one list row with icon avatar and subtle unread treatment
function NotificationRow({
  notification,
  onOpenDetail,
  isCompact = false,
}: {
  notification: NotificationRecord
  onOpenDetail: (notification: NotificationRecord) => void
  isCompact?: boolean
}) {
  const visual = notificationVisualMap[notification.eventType]
  const toneStyles = notificationToneStyles[visual.tone]
  const Icon = visual.icon

  return (
    <button
      type="button"
      onClick={() => onOpenDetail(notification)}
      className={cn(
        'relative w-full rounded-md text-left transition-all duration-150 hover:bg-muted/50 hover:shadow-sm',
        isCompact ? 'px-1 py-1.5' : 'px-1 py-2'
      )}
    >
      <div className={cn('grid grid-cols-[auto_minmax(0,1fr)] items-center', isCompact ? 'gap-2.5' : 'gap-3')}>
        <div
          className={cn(
            isCompact ? 'h-7 w-7' : 'h-8 w-8',
            'flex shrink-0 self-center items-center justify-center rounded-full',
            toneStyles.avatar
          )}
        >
          <Icon className={cn(isCompact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
        </div>
        <div className={cn('min-w-0 flex-1', isCompact ? 'space-y-0.5' : 'space-y-1')}>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
            <p
              className={cn(
                'min-w-0 flex-1 truncate pr-2',
                isCompact ? 'text-[13px]' : 'text-sm',
                notification.isRead ? 'font-medium' : 'font-semibold'
              )}
            >
              {notification.title}
            </p>
            <span
              className={cn(
                'shrink-0 whitespace-nowrap text-right text-muted-foreground',
                isCompact ? 'text-[11px]' : 'text-xs'
              )}
            >
              {formatNotificationTime(notification.createdAt)}
            </span>
          </div>
          <p
            className={cn(
              'line-clamp-2 text-muted-foreground',
              isCompact ? 'pr-5 text-[13px]' : 'pr-5 text-sm'
            )}
          >
            {notification.message}
          </p>
        </div>
      </div>
      {!notification.isRead ? (
        <span
          className={cn(
            'absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-blue-500',
            isCompact ? 'h-2 w-2' : 'h-2.5 w-2.5'
          )}
        />
      ) : null}
    </button>
  )
}

// NotificationListContent - render the shared notification list used by desktop and mobile
function NotificationListContent({
  notifications,
  unreadCount,
  isLoading,
  isMarkingAll,
  onMarkAllAsRead,
  onOpenDetail,
  isCompact = false,
  hideHeader = false,
}: {
  notifications: NotificationRecord[]
  unreadCount: number
  isLoading: boolean
  isMarkingAll: boolean
  onMarkAllAsRead: () => Promise<void>
  onOpenDetail: (notification: NotificationRecord) => void
  isCompact?: boolean
  hideHeader?: boolean
}) {
  return (
    <div className="flex h-full flex-col">
      {!hideHeader ? (
        <>
          <div className="flex items-center justify-between gap-3 px-4 py-4">
            <div className="space-y-1">
              <h3 className="text-base font-semibold">Notifications</h3>
              <p className="text-xs text-muted-foreground">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
                  : 'You are all caught up.'}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isMarkingAll || unreadCount === 0}
              onClick={() => {
                void onMarkAllAsRead()
              }}
              className="h-8 px-2.5 text-xs"
            >
              {isMarkingAll ? <IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Mark all as read
            </Button>
          </div>
          <Separator />
        </>
      ) : null}
      <ScrollArea className="h-full">
        <div className={cn(isCompact ? 'p-3 pr-6' : 'p-4 pr-5')}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                <IconNotification className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold">No notifications yet</p>
                <p className="text-sm text-muted-foreground">
                  New educator and student updates will appear here in real time.
                </p>
              </div>
            </div>
          ) : (
            notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <NotificationRow
                  notification={notification}
                  onOpenDetail={onOpenDetail}
                  isCompact={isCompact}
                />
                {index < notifications.length - 1 ? (
                  <Separator className={cn('bg-border/50', isCompact ? 'my-1.5' : 'my-2')} />
                ) : null}
              </React.Fragment>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// NotificationDetailContent - render the modal or drawer body for one selected notification
function NotificationDetailContent({
  notification,
  onOpenRelatedPage,
  showCloseButton = false,
}: {
  notification: NotificationRecord
  onOpenRelatedPage: () => void
  showCloseButton?: boolean
}) {
  const visual = notificationVisualMap[notification.eventType]
  const toneStyles = notificationToneStyles[visual.tone]
  const Icon = visual.icon
  const detailItems = getNotificationDetails(notification.metadata)

  return (
    <div className="flex h-full flex-col">
      <div className="max-h-[50vh] space-y-6 overflow-y-auto border-t border-b px-6 py-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
              toneStyles.avatar
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-[11px]">
                {visual.eventLabel}
              </Badge>
              <Badge variant="outline" className="text-[11px]">
                {notification.isRead ? 'Read' : 'Unread'}
              </Badge>
            </div>
            <div>
              <p className="text-base font-semibold">{notification.title}</p>
              <p className="text-sm text-muted-foreground">
                {formatNotificationTime(notification.createdAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="font-semibold">Message</p>
          <p className="text-sm leading-6 text-muted-foreground">{notification.message}</p>
        </div>

        {detailItems.length > 0 ? (
          <div className="space-y-3">
            <Separator />
            <p className="font-semibold">Details</p>
            <div className="space-y-3">
              {detailItems.map((detailItem) => (
                <div
                  key={`${detailItem.label}-${detailItem.value}`}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="text-sm font-medium">{detailItem.label}</span>
                  <span className="text-sm text-muted-foreground capitalize">{detailItem.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {showCloseButton ? (
        <DialogFooter className="px-6 py-4 sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="cursor-pointer">
              Close
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={onOpenRelatedPage}
            disabled={!notification.linkPath}
            className="cursor-pointer"
          >
            Proceed
          </Button>
        </DialogFooter>
      ) : (
        <DrawerFooter className="border-t px-6 py-4">
          <Button
            type="button"
            onClick={onOpenRelatedPage}
            disabled={!notification.linkPath}
            className="w-full justify-center"
          >
            Proceed
            <IconArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <DrawerClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      )}
    </div>
  )
}

// NotificationBell - render the role-aware real-time bell, list surface, and detail surface
export function NotificationBell({ role, userId }: NotificationBellProps) {
  const isMobile = useIsMobile()
  const router = useRouter()

  const [notifications, setNotifications] = React.useState<NotificationRecord[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isMarkingAll, setIsMarkingAll] = React.useState(false)
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = React.useState(false)
  const [isMobileListOpen, setIsMobileListOpen] = React.useState(false)
  const [selectedNotification, setSelectedNotification] = React.useState<NotificationRecord | null>(null)
  const [isDesktopDetailOpen, setIsDesktopDetailOpen] = React.useState(false)
  const [isMobileDetailOpen, setIsMobileDetailOpen] = React.useState(false)

  const loadNotifications = React.useCallback(async (showLoader = false) => {
    if (!userId) {
      return
    }

    if (showLoader) {
      setIsLoading(true)
    }

    try {
      const [recentNotifications, unreadNotifications] = await Promise.all([
        fetchRecentNotifications(userId, 10),
        fetchUnreadNotificationCount(userId),
      ])

      React.startTransition(() => {
        setNotifications(recentNotifications)
        setUnreadCount(unreadNotifications)
      })
    } catch (error) {
      console.error('Failed to load notifications', error)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  React.useEffect(() => {
    if (!userId || (role !== 'educator' && role !== 'student')) {
      return
    }

    void loadNotifications(true)

    const supabase = createClient()
    const channel = supabase
      .channel(`notification-bell-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tbl_notifications',
          filter: `recipient_user_id=eq.${userId}`,
        },
        () => {
          void loadNotifications(false)
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [loadNotifications, role, userId])

  if (!userId || (role !== 'educator' && role !== 'student')) {
    return null
  }

  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount)

  // openNotificationDetail - switch from the list surface into the notification detail surface
  const openNotificationDetail = async (notification: NotificationRecord) => {
    setSelectedNotification(notification)

    if (!notification.isRead) {
      React.startTransition(() => {
        setNotifications((currentNotifications) =>
          currentNotifications.map((currentNotification) =>
            currentNotification.id === notification.id
              ? {
                  ...currentNotification,
                  isRead: true,
                  readAt: new Date().toISOString(),
                }
              : currentNotification
          )
        )
        setUnreadCount((currentUnreadCount) => Math.max(0, currentUnreadCount - 1))
      })

      try {
        await markNotificationAsRead(notification.recipientUserId, notification.id)
      } catch (error) {
        console.error('Failed to mark notification as read', error)
        void loadNotifications(false)
      }
    }

    if (isMobile) {
      setIsMobileListOpen(false)
      setIsMobileDetailOpen(true)
      return
    }

    setIsDesktopMenuOpen(false)
    setIsDesktopDetailOpen(true)
  }

  // handleMarkAllAsRead - persist the read state without interrupting the existing list experience
  const handleMarkAllAsRead = async () => {
    if (!userId || unreadCount === 0) {
      return
    }

    setIsMarkingAll(true)

    try {
      await markAllNotificationsAsRead(userId)
      await loadNotifications(false)
    } catch (error) {
      console.error('Failed to mark notifications as read', error)
    } finally {
      setIsMarkingAll(false)
    }
  }

  // handleOpenRelatedPage - close the current surface and navigate to the stored destination path
  const handleOpenRelatedPage = () => {
    if (!selectedNotification?.linkPath) {
      return
    }

    setIsDesktopDetailOpen(false)
    setIsMobileDetailOpen(false)
    router.push(selectedNotification.linkPath)
  }

  const triggerButton = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="relative"
      aria-label="Open notifications"
      onClick={
        isMobile
          ? () => {
              setIsMobileListOpen(true)
            }
          : undefined
      }
    >
      <IconNotification className="h-5 w-5" />
      {unreadCount > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-5 items-center justify-center rounded-md bg-rose-500 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-white">
          {badgeLabel}
        </span>
      ) : null}
    </Button>
  )

  return (
    <>
      {isMobile ? (
        <>
          {triggerButton}
          <Drawer open={isMobileListOpen} onOpenChange={setIsMobileListOpen} direction="bottom">
            <DrawerContent className="bg-background inset-0 h-screen w-screen max-h-none max-w-none rounded-none border-0">
              <DrawerHeader className="px-4 pb-3 pt-6 text-left">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 flex-col items-start text-left">
                    <DrawerTitle>Notifications</DrawerTitle>
                    <DrawerDescription>
                      {unreadCount > 0
                        ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
                        : 'You are all caught up.'}
                    </DrawerDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isMarkingAll || unreadCount === 0}
                    onClick={() => {
                      void handleMarkAllAsRead()
                    }}
                    className="h-8 px-2.5 text-xs"
                  >
                    {isMarkingAll ? <IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Mark all as read
                  </Button>
                </div>
              </DrawerHeader>
              <Separator />
              <div className="min-h-0 flex-1">
                <NotificationListContent
                  notifications={notifications}
                  unreadCount={unreadCount}
                  isLoading={isLoading}
                  isMarkingAll={isMarkingAll}
                  onMarkAllAsRead={handleMarkAllAsRead}
                  onOpenDetail={openNotificationDetail}
                  hideHeader
                />
              </div>
            </DrawerContent>
          </Drawer>
        </>
      ) : (
        <DropdownMenu open={isDesktopMenuOpen} onOpenChange={setIsDesktopMenuOpen}>
          <DropdownMenuTrigger asChild>{triggerButton}</DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-popover text-popover-foreground w-[420px] rounded-2xl border p-0"
            sideOffset={10}
          >
            <div className="h-[560px]">
              <NotificationListContent
                notifications={notifications}
                unreadCount={unreadCount}
                isLoading={isLoading}
                isMarkingAll={isMarkingAll}
                onMarkAllAsRead={handleMarkAllAsRead}
                onOpenDetail={openNotificationDetail}
                isCompact
              />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <Dialog open={isDesktopDetailOpen} onOpenChange={setIsDesktopDetailOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[560px]">
          <DialogHeader className="px-6 pt-6 pb-4 text-left">
            <DialogTitle>Notification Details</DialogTitle>
            <DialogDescription>
              Review the full update before continuing to the related page.
            </DialogDescription>
          </DialogHeader>
          {selectedNotification ? (
            <NotificationDetailContent
              notification={selectedNotification}
              onOpenRelatedPage={handleOpenRelatedPage}
              showCloseButton
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Drawer open={isMobileDetailOpen} onOpenChange={setIsMobileDetailOpen} direction="bottom">
        <DrawerContent className="bg-background inset-0 h-screen w-screen max-h-none max-w-none rounded-none border-0">
          <DrawerHeader className="px-4 pb-3 pt-6 text-left">
            <DrawerTitle>Notification Details</DrawerTitle>
            <DrawerDescription>
              Review the full update before continuing to the related page.
            </DrawerDescription>
          </DrawerHeader>
          <Separator />
          <div className="min-h-0 flex-1 overflow-y-auto">
            {selectedNotification ? (
              <NotificationDetailContent
                notification={selectedNotification}
                onOpenRelatedPage={handleOpenRelatedPage}
              />
            ) : null}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
