'use client'

import { useEffect, useRef, useState } from 'react'
import {
  IconArrowUp,
  IconCheck,
  IconLoader2 as Loader2,
  IconPencilCheck,
  IconSchool,
  IconUsersGroup,
  IconUserCheck,
} from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import { fetchEducatorRealtimeMonitoringList } from '@/lib/supabase/educator-realtime-monitoring'

import { columns } from './columns'
import { DataTable } from './data-table'
import { ViewStudentsModal } from './view-students-modal'
import {
  educatorRealtimeMonitoringRowSchema,
  type EducatorRealtimeMonitoringRow,
} from '../data/schema'

// RealtimeMonitoringPageClient - render the educator monitoring page
export function RealtimeMonitoringPageClient() {
  // ==================== STATE ====================
  const [rows, setRows] = useState<EducatorRealtimeMonitoringRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedModuleRowId, setSelectedModuleRowId] = useState<number | null>(null)
  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false)
  const loadRowsRef = useRef<(mode?: 'initial' | 'refresh' | 'background') => Promise<void>>(async () => {})

  // ==================== LOAD ROWS ====================
  loadRowsRef.current = async (mode = 'refresh') => {
    const isInitialLoad = mode === 'initial'
    const isBackgroundLoad = mode === 'background'

    try {
      if (isInitialLoad) {
        setIsLoading(true)
      }

      if (!isInitialLoad && !isBackgroundLoad) {
        setIsRefreshing(true)
      }

      if (!isBackgroundLoad) {
        setError(null)
      }

      const monitoringRows = await fetchEducatorRealtimeMonitoringList()
      setRows(educatorRealtimeMonitoringRowSchema.array().parse(monitoringRows))
    } catch (loadError) {
      const nextMessage =
        loadError instanceof Error ? loadError.message : 'Failed to load real-time monitoring.'

      setError(nextMessage)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // ==================== INITIAL LOAD ====================
  useEffect(() => {
    void loadRowsRef.current('initial')
  }, [])

  // ==================== REALTIME SUBSCRIPTIONS ====================
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('educator-realtime-monitoring')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tbl_student_presence',
        },
        () => {
          void loadRowsRef.current('background')
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tbl_scores',
        },
        () => {
          void loadRowsRef.current('background')
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-6">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </CardHeader>
          <CardContent className="min-w-0 px-3 pb-4 sm:px-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="mt-4 h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="text-base font-medium">{error}</div>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => void loadRowsRef.current('refresh')}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <Loader2 size={18} className="mr-0 animate-spin" />
                  Loading...
                </>
              ) : (
                'Retry'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ==================== SUMMARY ====================
  const totalEnrolledCount = rows.reduce((total, row) => total + row.enrolledCount, 0)
  const totalAnsweringCount = rows.reduce((total, row) => total + row.answeringCount, 0)
  const totalOnlineCount = rows.reduce((total, row) => total + row.onlineCount, 0)
  const totalFinishedCount = rows.reduce((total, row) => total + row.finishedCount, 0)
  const selectedRow =
    rows.find((row) => row.moduleRowId === selectedModuleRowId) || null

  // ==================== MODAL ACTIONS ====================
  const handleMonitorStudents = (moduleRowId: number) => {
    setSelectedModuleRowId(moduleRowId)
    setIsStudentsModalOpen(true)
  }

  const handleStudentsModalOpenChange = (open: boolean) => {
    setIsStudentsModalOpen(open)

    if (!open) {
      setSelectedModuleRowId(null)
    }
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 md:px-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Real-Time Assessment Monitoring</h1>
        <p className="text-muted-foreground">
          Monitor enrolled students live by module and review whether they are offline, online, answering, or finished.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Enrolled Students</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{totalEnrolledCount}</span>
                  <span className="flex items-center gap-0.5 text-sm text-blue-500">
                    <IconUsersGroup size={14} />
                    Enrolled
                  </span>
                </div>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <IconSchool size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Answering Now</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{totalAnsweringCount}</span>
                  <span className="flex items-center gap-0.5 text-sm text-yellow-500">
                    <IconPencilCheck size={14} />
                    Active
                  </span>
                </div>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <IconPencilCheck size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Online Students</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{totalOnlineCount}</span>
                  <span className="flex items-center gap-0.5 text-sm text-green-500">
                    <IconArrowUp size={14} />
                    Online
                  </span>
                </div>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <IconUserCheck size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Finished Students</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{totalFinishedCount}</span>
                  <span className="flex items-center gap-0.5 text-sm text-blue-500">
                    <IconCheck size={14} />
                    Finished
                  </span>
                </div>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <IconCheck size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle>Assessment Monitoring Table</CardTitle>
          <CardDescription>
            Browse live monitoring rows, filter modules, and open student activity details.
          </CardDescription>
        </CardHeader>
        <CardContent className="min-w-0 px-3 pb-4 sm:px-6">
          <DataTable
            data={rows}
            columns={columns(handleMonitorStudents)}
            onRefresh={() => void loadRowsRef.current('refresh')}
            isRefreshing={isRefreshing}
          />
        </CardContent>
      </Card>

      {selectedRow ? (
        <ViewStudentsModal
          row={selectedRow}
          open={isStudentsModalOpen}
          onOpenChange={handleStudentsModalOpenChange}
        />
      ) : null}
    </div>
  )
}
