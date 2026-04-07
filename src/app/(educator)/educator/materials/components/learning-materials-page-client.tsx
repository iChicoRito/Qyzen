'use client'

import {
  IconBookUpload,
  IconFolders,
  IconLoader2,
  IconRefresh,
  IconStack2,
} from '@tabler/icons-react'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  fetchEducatorLearningMaterialGroups,
  fetchLearningMaterialTargetOptions,
  getLearningMaterialKindLabel,
  type LearningMaterialGroupRecord,
  type LearningMaterialTargetOption,
} from '@/lib/supabase/learning-materials'

import { LearningMaterialsTable } from './learning-materials-table'
import { UploadLearningMaterialsModal } from './upload-learning-materials-modal'

// LearningMaterialsPageClient - manage educator learning materials with real Supabase data
export function LearningMaterialsPageClient() {
  // ==================== STATE ====================
  const [groups, setGroups] = useState<LearningMaterialGroupRecord[]>([])
  const [targetOptions, setTargetOptions] = useState<LearningMaterialTargetOption[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // loadData - fetch grouped learning materials and upload targets
  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError(null)
      const [nextGroups, nextTargetOptions] = await Promise.all([
        fetchEducatorLearningMaterialGroups(),
        fetchLearningMaterialTargetOptions(),
      ])
      setGroups(nextGroups)
      setTargetOptions(nextTargetOptions)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load learning materials.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const stats = useMemo(() => {
    const allFiles = groups.flatMap((group) => group.files)
    return {
      groupedRows: groups.length,
      totalFiles: allFiles.length,
      presentationFiles: allFiles.filter(
        (file) => getLearningMaterialKindLabel(file.fileExtension) === 'Presentation'
      ).length,
      documentFiles: allFiles.filter(
        (file) => getLearningMaterialKindLabel(file.fileExtension) === 'Document'
      ).length,
    }
  }, [groups])

  if (loading) {
    return (
      <div className="flex min-w-0 flex-1 flex-col space-y-4 px-4 md:px-6">
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
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-w-0 flex-1 flex-col space-y-4 px-4 md:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Learning Materials</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="outline" onClick={() => loadData()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-3 px-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">Learning Materials</h1>
          <p className="text-sm text-muted-foreground">
            Upload and manage real learning materials grouped by subject and section.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => loadData(true)} disabled={refreshing}>
            {refreshing ? <IconLoader2 className="animate-spin" size={16} /> : <IconRefresh size={16} />}
            Refresh
          </Button>
          <UploadLearningMaterialsModal onUploaded={setGroups} targetOptions={targetOptions} />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col space-y-4 px-4 md:px-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Subject and Section Rows</p>
                  <p className="text-base font-semibold">{stats.groupedRows}</p>
                </div>
                <div className="rounded-md bg-secondary p-3">
                  <IconFolders size={18} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Uploaded Files</p>
                  <p className="text-base font-semibold">{stats.totalFiles}</p>
                </div>
                <div className="rounded-md bg-secondary p-3">
                  <IconBookUpload size={18} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Presentation Files</p>
                  <p className="text-base font-semibold">{stats.presentationFiles}</p>
                </div>
                <div className="rounded-md bg-secondary p-3">
                  <IconStack2 size={18} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Document Files</p>
                  <p className="text-base font-semibold">{stats.documentFiles}</p>
                </div>
                <div className="rounded-md bg-secondary p-3">
                  <IconStack2 size={18} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Uploaded Learning Materials</CardTitle>
            <CardDescription>
              This table keeps one main row per subject and section and shows the uploaded files inside each row.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LearningMaterialsTable
              groups={groups}
              onGroupsChanged={setGroups}
              targetOptions={targetOptions}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
