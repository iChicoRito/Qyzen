'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { IconLoader2 as Loader2 } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

// DashboardRealtimeShell - subscribe to dashboard tables and refresh server data
export function DashboardRealtimeShell({
  children,
  showStatusBadge = true,
}: {
  children: React.ReactNode
  showStatusBadge?: boolean
}) {
  const router = useRouter()
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const scheduleRefresh = () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }

      setIsRefreshing(true)
      refreshTimeoutRef.current = setTimeout(() => {
        router.refresh()
        setIsRefreshing(false)
      }, 600)
    }

    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tbl_users' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tbl_sections' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tbl_subjects' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tbl_enrolled' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tbl_modules' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tbl_quizzes' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tbl_scores' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tbl_learning_materials' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tbl_notifications' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tbl_group_chats' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tbl_group_chat_messages' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tbl_group_chat_reads' }, scheduleRefresh)
      .subscribe()

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }

      void supabase.removeChannel(channel)
    }
  }, [router])

  return (
    <div className="space-y-4">
      {showStatusBadge ? (
        <div className="flex items-center justify-end">
          <Badge variant="outline" className="rounded-md border-border/60 bg-background px-2 py-1 text-xs">
            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isRefreshing ? 'Refreshing live data' : 'Live data'}
          </Badge>
        </div>
      ) : null}
      {children}
    </div>
  )
}
