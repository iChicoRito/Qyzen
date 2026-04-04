'use client'

import { useEffect, useRef, useState } from 'react'
import { IconMessageCircleOff } from '@tabler/icons-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Skeleton } from '@/components/ui/skeleton'
import { useIsMobile } from '@/hooks/use-mobile'
import { type AppRole } from '@/lib/auth/auth-context'
import { createClient } from '@/lib/supabase/client'
import {
  fetchGroupChatList,
  fetchGroupChatMessages,
  markGroupChatAsRead,
  sendGroupChatMessage,
} from '@/lib/supabase/group-chats'
import { cn } from '@/lib/utils'
import type { GroupChatListItem, GroupChatMessage } from '@/types/group-chat'

import { GroupChatConversationList } from './group-chat-conversation-list'
import { GroupChatHeader } from './group-chat-header'
import { GroupChatMessageInput } from './group-chat-message-input'
import { GroupChatMessageList } from './group-chat-message-list'

interface GroupChatsPageClientProps {
  currentUserId: number
  role: Extract<AppRole, 'student' | 'educator'>
}

interface RealtimeChangePayload {
  new?: {
    group_chat_id?: number
  }
  old?: {
    group_chat_id?: number
  }
}

// GroupChatsPageClient - load and render the shared chat experience for one role
export function GroupChatsPageClient({ currentUserId, role }: GroupChatsPageClientProps) {
  const studentMessageCooldownMs = 10_000
  const isMobile = useIsMobile()
  const [chats, setChats] = useState<GroupChatListItem[]>([])
  const [messages, setMessages] = useState<GroupChatMessage[]>([])
  const [messagesChatId, setMessagesChatId] = useState<number | null>(null)
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isConversationRailCollapsed, setIsConversationRailCollapsed] = useState(false)
  const [isMobileConversationDrawerOpen, setIsMobileConversationDrawerOpen] = useState(false)
  const [isLoadingChats, setIsLoadingChats] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [studentCooldownEndsAt, setStudentCooldownEndsAt] = useState<number | null>(null)
  const [studentCooldownSeconds, setStudentCooldownSeconds] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const loadChatsRef = useRef<(mode?: 'initial' | 'refresh' | 'background') => Promise<void>>(async () => {})
  const loadMessagesRef = useRef<
    (groupChatId: number, mode?: 'initial' | 'refresh' | 'background') => Promise<void>
  >(async () => {})
  const markReadRef = useRef<(groupChatId: number) => Promise<void>>(async () => {})
  const isStudentCooldownActive = role === 'student' && studentCooldownSeconds > 0

  // ==================== LOADERS ====================
  loadChatsRef.current = async (mode = 'refresh') => {
    const isInitialLoad = mode === 'initial'

    try {
      if (isInitialLoad) {
        setIsLoadingChats(true)
      }

      setError(null)
      const nextChats = await fetchGroupChatList()
      setChats(nextChats)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load group chats.')
    } finally {
      setIsLoadingChats(false)
    }
  }

  loadMessagesRef.current = async (groupChatId, mode = 'refresh') => {
    const isForegroundLoad = mode !== 'background'

    try {
      if (isForegroundLoad) {
        setIsLoadingMessages(true)
      }

      const nextMessages = await fetchGroupChatMessages(groupChatId)
      setMessages(nextMessages)
      setMessagesChatId(groupChatId)
    } catch (loadError) {
      toast.error(loadError instanceof Error ? loadError.message : 'Failed to load chat messages.')
    } finally {
      setIsLoadingMessages(false)
    }
  }

  markReadRef.current = async (groupChatId) => {
    try {
      await markGroupChatAsRead(groupChatId, currentUserId)
      await loadChatsRef.current('background')
    } catch {
      // keep read updates silent in the UI
    }
  }

  // ==================== INITIAL LOAD ====================
  useEffect(() => {
    void loadChatsRef.current('initial')
  }, [])

  // ==================== STUDENT COOLDOWN ====================
  useEffect(() => {
    if (role !== 'student') {
      setStudentCooldownEndsAt(null)
      setStudentCooldownSeconds(0)
      return
    }

    if (!studentCooldownEndsAt) {
      setStudentCooldownSeconds(0)
      return
    }

    const updateCooldown = () => {
      const remainingMs = studentCooldownEndsAt - Date.now()

      if (remainingMs <= 0) {
        setStudentCooldownEndsAt(null)
        setStudentCooldownSeconds(0)
        return
      }

      setStudentCooldownSeconds(Math.ceil(remainingMs / 1000))
    }

    updateCooldown()
    const intervalId = window.setInterval(updateCooldown, 250)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [role, studentCooldownEndsAt])

  // ==================== SELECTION ====================
  useEffect(() => {
    if (chats.length === 0) {
      setSelectedChatId(null)
      setMessages([])
      setMessagesChatId(null)
      return
    }

    const selectedExists = chats.some((chat) => chat.id === selectedChatId)

    if (selectedExists) {
      return
    }

    setSelectedChatId(chats[0].id)
  }, [chats, isMobile, selectedChatId])

  useEffect(() => {
    if (!isMobile) {
      setIsMobileConversationDrawerOpen(false)
    }
  }, [isMobile])

  useEffect(() => {
    if (!selectedChatId) {
      setMessages([])
      setMessagesChatId(null)
      return
    }

    setMessages([])
    setMessagesChatId(null)
    void loadMessagesRef.current(selectedChatId, 'initial')
    void markReadRef.current(selectedChatId)
  }, [selectedChatId])

  // ==================== READ TRACKING ====================
  useEffect(() => {
    if (!selectedChatId) {
      return
    }

    const handleWindowFocus = () => {
      void markReadRef.current(selectedChatId)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void markReadRef.current(selectedChatId)
      }
    }

    window.addEventListener('focus', handleWindowFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleWindowFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [selectedChatId])

  // ==================== REALTIME ====================
  useEffect(() => {
    const supabase = createClient()
    const handleSelectedChatMessageChange = (payload: RealtimeChangePayload) => {
      const payloadChatId = payload.new?.group_chat_id ?? payload.old?.group_chat_id ?? null

      void loadChatsRef.current('background')

      if (selectedChatId && payloadChatId === selectedChatId) {
        void loadMessagesRef.current(selectedChatId, 'background')
        void markReadRef.current(selectedChatId)
      }
    }

    const channel = supabase
      .channel(`group-chats-${role}-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tbl_group_chat_messages',
        },
        (payload: unknown) => handleSelectedChatMessageChange(payload as RealtimeChangePayload)
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tbl_group_chat_reads',
        },
        (payload: unknown) => {
          const realtimePayload = payload as RealtimeChangePayload
          const payloadChatId = realtimePayload.new?.group_chat_id ?? realtimePayload.old?.group_chat_id ?? null

          void loadChatsRef.current('background')

          if (selectedChatId && payloadChatId === selectedChatId) {
            void loadMessagesRef.current(selectedChatId, 'background')
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tbl_group_chats',
        },
        () => {
          void loadChatsRef.current('background')
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tbl_enrolled',
        },
        () => {
          void loadChatsRef.current('background')
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tbl_student_presence',
        },
        () => {
          void loadChatsRef.current('background')
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [currentUserId, role, selectedChatId])

  // ==================== FALLBACK REFRESH ====================
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== 'visible') {
        return
      }

      void loadChatsRef.current('background')

      if (selectedChatId) {
        void loadMessagesRef.current(selectedChatId, 'background')
      }
    }, 3000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [selectedChatId])

  // ==================== ACTIONS ====================
  const handleSendMessage = async (content: string) => {
    if (!selectedChatId || isStudentCooldownActive) {
      return
    }

    try {
      setIsSendingMessage(true)
      await sendGroupChatMessage({
        groupChatId: selectedChatId,
        senderUserId: currentUserId,
        content,
      })

      await markReadRef.current(selectedChatId)
      await loadMessagesRef.current(selectedChatId, 'background')
      await loadChatsRef.current('background')

      if (role === 'student') {
        setStudentCooldownEndsAt(Date.now() + studentMessageCooldownMs)
      }
    } catch (sendError) {
      toast.error(sendError instanceof Error ? sendError.message : 'Failed to send the message.')
      throw sendError
    } finally {
      setIsSendingMessage(false)
    }
  }

  const filteredChats = chats.filter((chat) => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    if (!normalizedQuery) {
      return true
    }

    return (
      chat.subjectName.toLowerCase().includes(normalizedQuery) ||
      chat.sectionName.toLowerCase().includes(normalizedQuery)
    )
  })

  const selectedChat = chats.find((chat) => chat.id === selectedChatId) || null
  const selectedChatMessages = selectedChat && messagesChatId === selectedChat.id ? messages : []
  const hasUnreadConversations = chats.some((chat) => chat.unreadCount > 0)

  if (isLoadingChats) {
    return (
      <div className="flex min-h-0 flex-1 px-0 md:px-6">
        <div className="grid min-h-0 w-full gap-4 md:min-h-[36rem] md:grid-cols-[20rem_minmax(0,1fr)]">
          <Card className="overflow-hidden">
            <CardContent className="space-y-3 p-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardContent className="space-y-4 p-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-24 w-2/3" />
              <Skeleton className="ml-auto h-20 w-1/2" />
              <Skeleton className="h-24 w-3/4" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-0 flex-1 px-0 md:px-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Group Chats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button type="button" variant="outline" onClick={() => void loadChatsRef.current('refresh')}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const conversationRailWidthClass = isConversationRailCollapsed
    ? 'md:grid-cols-[4.5rem_minmax(0,1fr)]'
    : 'md:grid-cols-[minmax(19rem,22rem)_minmax(0,1fr)]'

  return (
    <div className="flex min-h-0 flex-1 px-0 md:px-6">
      <div
        className={cn(
          '-my-4 grid h-[calc(100svh-var(--header-height)-2rem)] max-h-[calc(100svh-var(--header-height)-2rem)] min-h-0 w-full grid-cols-1 overflow-hidden border-y bg-background md:my-0 md:h-[calc(100dvh-var(--header-height)-3rem)] md:max-h-[calc(100dvh-var(--header-height)-3rem)] md:min-h-[36rem] md:rounded-lg md:border',
          conversationRailWidthClass
        )}
      >
        {!isMobile ? (
          <GroupChatConversationList
            chats={filteredChats}
            selectedChatId={selectedChatId}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            onSelectChat={setSelectedChatId}
            isCollapsed={isConversationRailCollapsed}
            onToggleCollapsed={() => setIsConversationRailCollapsed((currentValue) => !currentValue)}
          />
        ) : null}

        <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden">
          <GroupChatHeader
            chat={selectedChat}
            showMenuButton={isMobile}
            hasUnreadConversations={hasUnreadConversations}
            onOpenConversationDrawer={isMobile ? () => setIsMobileConversationDrawerOpen(true) : undefined}
          />

          {selectedChat ? (
            <>
              <GroupChatMessageList
                groupChatId={selectedChat.id}
                currentUserId={currentUserId}
                messages={selectedChatMessages}
                isLoading={isLoadingMessages}
              />
              <GroupChatMessageInput
                disabled={!selectedChat}
                isSending={isSendingMessage}
                cooldownSeconds={role === 'student' ? studentCooldownSeconds : 0}
                placeholder={`Message ${selectedChat.subjectName}...`}
                onSendMessage={handleSendMessage}
              />
            </>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
              <IconMessageCircleOff size={28} className="text-muted-foreground" />
              <p className="font-medium">No group chat selected</p>
              <p className="text-sm text-muted-foreground">
                Choose a subject conversation from the list to view messages.
              </p>
            </div>
          )}
        </div>
      </div>

      {isMobile ? (
        <Drawer
          open={isMobileConversationDrawerOpen}
          onOpenChange={setIsMobileConversationDrawerOpen}
          direction="left"
        >
          <DrawerContent className="h-screen w-[85vw] max-w-md rounded-none border-r border-l-0 border-t-0 border-b-0">
            <DrawerHeader className="border-b px-4 py-4 text-left">
              <DrawerTitle>Group Chats</DrawerTitle>
            </DrawerHeader>

            <div className="min-h-0 flex-1 overflow-hidden">
              <GroupChatConversationList
                chats={filteredChats}
                selectedChatId={selectedChatId}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                hideHeaderTitle
                onSelectChat={(chatId) => {
                  setSelectedChatId(chatId)
                  setIsMobileConversationDrawerOpen(false)
                }}
              />
            </div>
          </DrawerContent>
        </Drawer>
      ) : null}
    </div>
  )
}
