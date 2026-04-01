'use client'

import { useEffect, useState } from 'react'
import {
  IconArrowUp,
  IconBooks,
  IconClockHour4,
  IconLayersLinked,
  IconToggleLeft,
} from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { type ModulePermissions } from '@/lib/auth/module-permissions'
import {
  createModules,
  fetchModules,
  type ModuleCreateInput,
  type ModuleRecord,
} from '@/lib/supabase/modules'

import { type Module } from '../data/schema'
import { moduleSchema } from '../data/schema'
import { getColumns } from './columns'
import { DataTable } from './data-table'

interface ModulesPageClientProps {
  permissions: ModulePermissions
}

// ModulesPageClient - manage educator modules
export function ModulesPageClient({ permissions }: ModulesPageClientProps) {
  // ==================== STATE ====================
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ==================== LOAD DATA ====================
  const loadModules = async () => {
    try {
      setLoading(true)
      setError(null)
      const moduleList = await fetchModules()
      setModules(moduleSchema.array().parse(moduleList))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load modules.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadModules()
  }, [])

  // handleAddModules - create new module rows
  const handleAddModules = async (input: ModuleCreateInput) => {
    const createdModules = await createModules(input)
    const parsedModules = moduleSchema.array().parse(createdModules)
    setModules((prev) => [...parsedModules, ...prev])
  }

  // handleDeleteModule - remove deleted module row
  const handleDeleteModule = (moduleId: number) => {
    setModules((prev) => prev.filter((module) => module.id !== moduleId))
  }

  // handleUpdateModule - replace the updated module row
  const handleUpdateModule = (updatedModule: ModuleRecord) => {
    const parsedModule = moduleSchema.parse(updatedModule)
    setModules((prev) =>
      prev.map((module) => (module.id === parsedModule.id ? parsedModule : module))
    )
  }

  // ==================== STATS ====================
  const stats = {
    total: modules.length,
    active: modules.filter((module) => module.status === 'active').length,
    shuffled: modules.filter((module) => module.isShuffle).length,
    scheduled: modules.filter((module) => module.startDate && module.endDate).length,
  }

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
            <Skeleton className="h-6 w-40" />
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
            <CardTitle>Module Management</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="outline" className="cursor-pointer" onClick={loadModules}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ==================== RENDER ====================
  return (
    <>
      <div className="flex flex-col gap-2 px-4 md:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Modules</h1>
        <p className="text-muted-foreground">
          Create assessment modules and assign them to one or more subject and section pairs.
        </p>
      </div>

      <div className="flex min-w-0 flex-1 flex-col space-y-6 px-4 md:px-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Modules</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stats.total}</span>
                    <span className="flex items-center gap-0.5 text-sm text-green-500">
                      <IconArrowUp size={14} />
                      {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <IconBooks size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Modules</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stats.active}</span>
                    <span className="flex items-center gap-0.5 text-sm text-green-500">
                      <IconLayersLinked size={14} />
                      Live
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <IconLayersLinked size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Shuffle Enabled</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stats.shuffled}</span>
                    <span className="flex items-center gap-0.5 text-sm text-blue-500">
                      <IconToggleLeft size={14} />
                      Enabled
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <IconToggleLeft size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stats.scheduled}</span>
                    <span className="flex items-center gap-0.5 text-sm text-yellow-500">
                      <IconClockHour4 size={14} />
                      Ready
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <IconClockHour4 size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Module Management</CardTitle>
            <CardDescription>
              View, filter, and create modules with subject and section-based scheduling.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={modules}
              columns={getColumns({
                permissions,
                onModuleUpdated: handleUpdateModule,
                onModuleDeleted: handleDeleteModule,
              })}
              onAddModules={permissions.canCreate ? handleAddModules : undefined}
              permissions={permissions}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
