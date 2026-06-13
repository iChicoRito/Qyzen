'use client'

import { useEffect, useState } from 'react'
import { IconDownload, IconLoader2 as Loader2 } from '@tabler/icons-react'
import JSZip from 'jszip'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import {
  fetchAllEducatorScoreExportData,
  fetchEducatorScoreExportOptions,
} from '@/lib/supabase/educator-scores'
import { buildFileName, buildWorkbook, workbookToBuffer } from '../utils/workbook-utils'

interface DownloadAllGradesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// DownloadAllGradesModal - bulk-download all grade sheets as a zip
export function DownloadAllGradesModal({ open, onOpenChange }: DownloadAllGradesModalProps) {
  const [assessmentCount, setAssessmentCount] = useState<number | null>(null)
  const [isLoadingCount, setIsLoadingCount] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  // loadCount - fetch how many assessments will be included
  const loadCount = async () => {
    try {
      setIsLoadingCount(true)
      const options = await fetchEducatorScoreExportOptions()
      setAssessmentCount(options.length)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load assessment count.')
      setAssessmentCount(0)
    } finally {
      setIsLoadingCount(false)
    }
  }

  // handleDownloadAll - fetch all export data, build workbooks, zip, download
  const handleDownloadAll = async () => {
    try {
      setIsDownloading(true)
      const allResults = await fetchAllEducatorScoreExportData()

      if (allResults.length === 0) {
        toast.error('No assessments found to download.')
        return
      }

      const zip = new JSZip()

      for (const result of allResults) {
        const workbook = buildWorkbook(result)
        const buffer = await workbookToBuffer(workbook)
        zip.file(buildFileName(result.summary), buffer)
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const today = new Date().toISOString().slice(0, 10)
      const url = URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `qyzen-all-grades-${today}.zip`
      link.click()
      URL.revokeObjectURL(url)

      toast.success(`Downloaded ${allResults.length} grade sheet${allResults.length === 1 ? '' : 's'}.`)
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to download all grades.')
    } finally {
      setIsDownloading(false)
    }
  }

  useEffect(() => {
    if (open) {
      setAssessmentCount(null)
      loadCount()
      return
    }

    setAssessmentCount(null)
  }, [open])

  // ==================== RENDER ====================
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent desktopClassName="sm:max-w-[480px]">
        <ResponsiveDialogHeader className="pb-0">
          <ResponsiveDialogTitle>Download All Grades</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Export grade sheets for all assessments and download them as a single zip file.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="space-y-4">
          <div className="rounded-lg border p-4">
            {isLoadingCount ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 size={16} className="animate-spin" />
                Loading assessment count...
              </div>
            ) : assessmentCount !== null ? (
              <div className="space-y-1">
                <div className="text-sm font-medium">
                  {assessmentCount === 0
                    ? 'No assessments found.'
                    : `${assessmentCount} assessment${assessmentCount === 1 ? '' : 's'} will be exported.`}
                </div>
                {assessmentCount > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Each assessment will be saved as a separate XLSX file inside a single ZIP archive.
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isDownloading}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleDownloadAll}
            disabled={isLoadingCount || isDownloading || assessmentCount === 0}
          >
            {isDownloading ? (
              <>
                <Loader2 size={18} className="mr-0 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <IconDownload size={18} className="mr-0" />
                Download All
              </>
            )}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
