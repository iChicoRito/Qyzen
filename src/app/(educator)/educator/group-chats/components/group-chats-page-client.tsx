'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  IconArrowUp,
  IconMessages,
  IconMessageCircleUser,
  IconUserCheck,
  IconUsersGroup,
  IconUserX,
} from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchEducatorManagedGroupChats } from '@/lib/supabase/group-chats'

import {
  educatorManagedGroupChatSchema,
  type EducatorManagedGroupChatRow,
} from '../data/schema'
import { getColumns } from './columns'
import { DataTable } from './data-table'

// EducatorGroupChatsPageClient - manage educator-owned group chats with cards, table, and modals
export function EducatorGroupChatsPageClient() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [groupChats, setGroupChats] = useState<EducatorManagedGroupChatRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const shouldOpenCreateModal = searchParams.get('create') === '1'

  const loadGroupChats = async () => {
    try {
      setLoading(true)
      setError(null)
      const groupChatList = await fetchEducatorManagedGroupChats()
      setGroupChats(educatorManagedGroupChatSchema.array().parse(groupChatList))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load group chats.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGroupChats()
  }, [])

  useEffect(() => {
    if (shouldOpenCreateModal) {
      setIsCreateModalOpen(true)
    }
  }, [shouldOpenCreateModal])

  const handleCreateModalOpenChange = (open: boolean) => {
    setIsCreateModalOpen(open)

    if (!open && shouldOpenCreateModal) {
      router.replace(pathname)
    }
  }

  const handleGroupChatCreated = (groupChat: EducatorManagedGroupChatRow) => {
    setGroupChats((prev) => [educatorManagedGroupChatSchema.parse(groupChat), ...prev])
  }

  const handleGroupChatDeleted = (groupChatId: number) => {
    setGroupChats((prev) => prev.filter((groupChat) => groupChat.id !== groupChatId))
  }

  const stats = useMemo(() => {
    const totalChats = groupChats.length
    const totalStudents = groupChats.reduce((sum, row) => sum + row.studentCount, 0)
    const totalOnlineStudents = groupChats.reduce((sum, row) => sum + row.onlineStudentCount, 0)
    const emptyChats = groupChats.filter((row) => row.studentCount === 0).length

    return {
      totalChats,
      totalStudents,
      totalOnlineStudents,
      emptyChats,
    }
  }, [groupChats])

  if (loading) {
    return (
      <div className="flex min-w-0 flex-1 flex-col space-y-6 px-4 md:px-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-w-0 flex-1 flex-col space-y-6 px-4 md:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Group Chat Management</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="outline" className="cursor-pointer" onClick={loadGroupChats}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-2 px-4 md:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Group Chats</h1>
            <p className="text-muted-foreground">
              Create, review, and manage your educator-owned classroom group chat rooms in one place.
            </p>
          </div>

          <Button asChild type="button" variant="outline" className="cursor-pointer">
            <Link href="/educator/group-chats">
              <IconMessages size={18} />
              Open Live Chats
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col space-y-6 px-4 md:px-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Group Chats</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stats.totalChats}</span>
                    <span className="flex items-center gap-0.5 text-sm text-green-500">
                      <IconArrowUp size={14} />
                      Ready
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <IconMessageCircleUser size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Students Covered</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stats.totalStudents}</span>
                    <span className="flex items-center gap-0.5 text-sm text-blue-500">
                      <IconUsersGroup size={14} />
                      Active
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <IconUsersGroup size={24} />
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
                    <span className="text-2xl font-bold">{stats.totalOnlineStudents}</span>
                    <span className="flex items-center gap-0.5 text-sm text-green-500">
                      <IconUserCheck size={14} />
                      Live
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
                  <p className="text-sm font-medium text-muted-foreground">Empty Group Chats</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stats.emptyChats}</span>
                    <span className="flex items-center gap-0.5 text-sm text-yellow-500">
                      <IconUserX size={14} />
                      Awaiting students
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <IconUserX size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Group Chat Management</CardTitle>
            <CardDescription>
              View classroom chat rooms, inspect their details, and manage educator-created chat access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={groupChats}
              columns={getColumns({
                onGroupChatDeleted: handleGroupChatDeleted,
              })}
              openCreateModal={isCreateModalOpen}
              onCreateModalOpenChange={handleCreateModalOpenChange}
              onGroupChatCreated={handleGroupChatCreated}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
