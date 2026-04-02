'use client'

import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { IconDownload, IconLoader2 as Loader2 } from '@tabler/icons-react'
import ExcelJS from 'exceljs'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  fetchEducatorScoreExportData,
  fetchEducatorScoreExportOptions,
  type EducatorScoreExportOption,
  type EducatorScoreExportResult,
} from '@/lib/supabase/educator-scores'
import {
  educatorScoreExportSchema,
  type EducatorScoreExportSchema,
} from '@/lib/validations/educator-score-export.schema'

interface DownloadGradesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// getUniqueOptions - build sorted dropdown options
function getUniqueOptions<T>(items: T[], getKey: (item: T) => string, getLabel: (item: T) => string) {
  const optionMap = new Map<string, string>()

  items.forEach((item) => {
    optionMap.set(getKey(item), getLabel(item))
  })

  return Array.from(optionMap.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((leftOption, rightOption) => leftOption.label.localeCompare(rightOption.label))
}

// buildFileName - create the downloaded file name
function buildFileName(summary: EducatorScoreExportResult['summary']) {
  const safeValue = `${summary.subjectName}-${summary.sectionName}-${summary.moduleCode}-${summary.termName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `${safeValue || 'educator-grades'}.xlsx`
}

// downloadWorkbook - save the generated workbook file
async function downloadWorkbook(workbook: InstanceType<typeof ExcelJS.Workbook>, fileName: string) {
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

// DownloadGradesModal - export selected score rows into xlsx
export function DownloadGradesModal({
  open,
  onOpenChange,
}: DownloadGradesModalProps) {
  // ==================== STATE ====================
  const [options, setOptions] = useState<EducatorScoreExportOption[]>([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [previewData, setPreviewData] = useState<EducatorScoreExportResult | null>(null)

  // ==================== FORM SETUP ====================
  const form = useForm<EducatorScoreExportSchema>({
    resolver: zodResolver(educatorScoreExportSchema),
    defaultValues: {
      subjectId: '',
      sectionId: '',
      moduleRowId: '',
      termId: '',
    },
  })

  const subjectId = form.watch('subjectId')
  const sectionId = form.watch('sectionId')
  const moduleRowId = form.watch('moduleRowId')
  const termId = form.watch('termId')

  const subjectOptions = useMemo(
    () => getUniqueOptions(options, (option) => String(option.subjectId), (option) => option.subjectName),
    [options]
  )
  const filteredSectionSource = useMemo(
    () => options.filter((option) => !subjectId || String(option.subjectId) === subjectId),
    [options, subjectId]
  )
  const sectionOptions = useMemo(
    () =>
      getUniqueOptions(
        filteredSectionSource,
        (option) => String(option.sectionId),
        (option) => option.sectionName
      ),
    [filteredSectionSource]
  )
  const filteredModuleSource = useMemo(
    () =>
      filteredSectionSource.filter(
        (option) => !sectionId || String(option.sectionId) === sectionId
      ),
    [filteredSectionSource, sectionId]
  )
  const moduleOptions = useMemo(
    () =>
      getUniqueOptions(
        filteredModuleSource,
        (option) => String(option.moduleRowId),
        (option) => option.moduleCode
      ),
    [filteredModuleSource]
  )
  const filteredTermSource = useMemo(
    () =>
      filteredModuleSource.filter(
        (option) => !moduleRowId || String(option.moduleRowId) === moduleRowId
      ),
    [filteredModuleSource, moduleRowId]
  )
  const termOptions = useMemo(
    () => getUniqueOptions(filteredTermSource, (option) => String(option.termId), (option) => option.termName),
    [filteredTermSource]
  )

  // loadOptions - load export dropdown data
  const loadOptions = async () => {
    try {
      setIsLoadingOptions(true)
      const exportOptions = await fetchEducatorScoreExportOptions()
      setOptions(exportOptions)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load score export options.')
    } finally {
      setIsLoadingOptions(false)
    }
  }

  // buildWorkbook - create the formatted export sheet
  const buildWorkbook = (result: EducatorScoreExportResult) => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Grades')
    const columns = [
      'Student Name',
      'Student ID',
      'Subject',
      'Section',
      'Module Code',
      'Academic Term',
      'Highest Score',
      'Total Questions',
      'Percentage',
      'Status',
      'Remark',
      'Highest Submitted At',
    ]

    worksheet.mergeCells('A1:L1')
    worksheet.getCell('A1').value = 'Qyzen Grade Export'
    worksheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } }
    worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' }
    worksheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '171717' },
    }

    worksheet.getCell('A3').value = 'Subject'
    worksheet.getCell('B3').value = result.summary.subjectName
    worksheet.getCell('A4').value = 'Section'
    worksheet.getCell('B4').value = result.summary.sectionName
    worksheet.getCell('A5').value = 'Module Code'
    worksheet.getCell('B5').value = result.summary.moduleCode
    worksheet.getCell('A6').value = 'Academic Term'
    worksheet.getCell('B6').value = result.summary.termName
    worksheet.getCell('D3').value = 'Total Enrolled'
    worksheet.getCell('E3').value = result.summary.totalEnrolled
    worksheet.getCell('D4').value = 'With Submission'
    worksheet.getCell('E4').value = result.summary.studentsWithSubmission
    worksheet.getCell('D5').value = 'No Submission'
    worksheet.getCell('E5').value = result.summary.studentsWithoutSubmission

    ;['A3', 'A4', 'A5', 'A6', 'D3', 'D4', 'D5'].forEach((cellRef) => {
      const cell = worksheet.getCell(cellRef)
      cell.font = { bold: true }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F4F4F5' },
      }
    })

    const headerRow = worksheet.getRow(8)
    columns.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1)
      cell.value = header
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '0A0A0A' },
      }
      cell.border = {
        top: { style: 'thin', color: { argb: 'D4D4D8' } },
        left: { style: 'thin', color: { argb: 'D4D4D8' } },
        bottom: { style: 'thin', color: { argb: 'D4D4D8' } },
        right: { style: 'thin', color: { argb: 'D4D4D8' } },
      }
    })

    result.rows.forEach((rowData, rowIndex) => {
      const row = worksheet.getRow(rowIndex + 9)
      const cellValues = [
        rowData.studentName,
        rowData.studentUserId,
        rowData.subjectName,
        rowData.sectionName,
        rowData.moduleCode,
        rowData.termName,
        rowData.highestScore,
        rowData.totalQuestions,
        `${rowData.percentage}%`,
        rowData.statusLabel,
        rowData.remark,
        rowData.highestSubmittedAt || 'Not submitted',
      ]

      cellValues.forEach((value, columnIndex) => {
        const cell = row.getCell(columnIndex + 1)
        cell.value = value
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: row.number % 2 === 0 ? 'F5F5F5' : 'FFFFFF' },
        }
        cell.border = {
          top: { style: 'thin', color: { argb: 'E4E4E7' } },
          left: { style: 'thin', color: { argb: 'E4E4E7' } },
          bottom: { style: 'thin', color: { argb: 'E4E4E7' } },
          right: { style: 'thin', color: { argb: 'E4E4E7' } },
        }
      })
    })

    worksheet.columns = [
      { key: 'student_name', width: 28 },
      { key: 'student_id', width: 20 },
      { key: 'subject', width: 28 },
      { key: 'section', width: 20 },
      { key: 'module_code', width: 18 },
      { key: 'term_name', width: 24 },
      { key: 'highest_score', width: 14 },
      { key: 'total_questions', width: 16 },
      { key: 'percentage', width: 14 },
      { key: 'status', width: 16 },
      { key: 'remark', width: 24 },
      { key: 'highest_submitted_at', width: 24 },
    ]
    worksheet.views = [{ state: 'frozen', ySplit: 8 }]

    return workbook
  }

  // handleDownload - export the preview rows
  const handleDownload = async () => {
    if (!previewData) {
      toast.error('Select a valid score export option first.')
      return
    }

    try {
      const workbook = buildWorkbook(previewData)
      await downloadWorkbook(workbook, buildFileName(previewData.summary))
      toast.success('Grades downloaded successfully.')
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to download grades.')
    }
  }

  useEffect(() => {
    if (open) {
      loadOptions()
      return
    }

    form.reset({
      subjectId: '',
      sectionId: '',
      moduleRowId: '',
      termId: '',
    })
    setPreviewData(null)
  }, [form, open])

  useEffect(() => {
    form.setValue('sectionId', '')
    form.setValue('moduleRowId', '')
    form.setValue('termId', '')
    setPreviewData(null)
  }, [form, subjectId])

  useEffect(() => {
    form.setValue('moduleRowId', '')
    form.setValue('termId', '')
    setPreviewData(null)
  }, [form, sectionId])

  useEffect(() => {
    form.setValue('termId', '')
    setPreviewData(null)
  }, [form, moduleRowId])

  useEffect(() => {
    const shouldLoadPreview = open && subjectId && sectionId && moduleRowId && termId

    if (!shouldLoadPreview) {
      setPreviewData(null)
      return
    }

    const loadPreview = async () => {
      try {
        setIsLoadingPreview(true)
        const exportData = await fetchEducatorScoreExportData({
          subjectId: Number(subjectId),
          sectionId: Number(sectionId),
          moduleRowId: Number(moduleRowId),
          termId: Number(termId),
        })
        setPreviewData(exportData)
      } catch (error) {
        setPreviewData(null)
        toast.error(error instanceof Error ? error.message : 'Failed to load score export preview.')
      } finally {
        setIsLoadingPreview(false)
      }
    }

    loadPreview()
  }, [moduleRowId, open, sectionId, subjectId, termId])

  // ==================== RENDER ====================
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px]">
        <DialogHeader>
          <DialogTitle>Download Grades</DialogTitle>
          <DialogDescription>
            Choose the subject, section, module, and term before downloading the formatted grade sheet.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="subjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={isLoadingOptions}>
                      <FormControl>
                        <SelectTrigger className="w-full cursor-pointer">
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjectOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sectionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isLoadingOptions || !subjectId}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full cursor-pointer">
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sectionOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="moduleRowId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module Code</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isLoadingOptions || !sectionId}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full cursor-pointer">
                          <SelectValue placeholder="Select module" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {moduleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="termId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academic Term</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isLoadingOptions || !moduleRowId}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full cursor-pointer">
                          <SelectValue placeholder="Select term" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {termOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="rounded-lg border p-4">
              <div className="space-y-1">
                <div className="text-sm font-medium">Summary Review</div>
                <div className="text-muted-foreground text-sm">
                  Review the selected class details before downloading the grade sheet.
                </div>
              </div>
              {isLoadingPreview ? (
                <div className="mt-4 flex items-center text-sm text-muted-foreground">
                  <Loader2 size={18} className="mr-0 animate-spin" />
                  Loading selected grade summary...
                </div>
              ) : previewData ? (
                <div className="mt-4 space-y-5">
                  <div className="rounded-lg border bg-card px-4 py-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="text-muted-foreground text-xs">
                          Selected Export
                        </div>
                        <div className="font-semibold">{previewData.summary.moduleCode}</div>
                        <div className="text-muted-foreground text-sm">
                          {previewData.summary.subjectName} | {previewData.summary.sectionName}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {previewData.summary.termName}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border bg-card px-4 py-4">
                      <div className="text-muted-foreground text-xs">
                        Total Enrolled
                      </div>
                      <div className="mt-3 font-semibold">{previewData.summary.totalEnrolled}</div>
                    </div>
                    <div className="rounded-lg border bg-green-500/10 px-4 py-4">
                      <div className="text-xs text-green-500">
                        With Submission
                      </div>
                      <div className="mt-3 font-semibold text-green-500">
                        {previewData.summary.studentsWithSubmission}
                      </div>
                    </div>
                    <div className="rounded-lg border bg-yellow-500/10 px-4 py-4">
                      <div className="text-xs text-yellow-500">
                        No Submission
                      </div>
                      <div className="mt-3 font-semibold text-yellow-500">
                        {previewData.summary.studentsWithoutSubmission}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                    <div>
                      <div className="text-muted-foreground text-xs">Subject</div>
                      <div className="mt-1 text-sm font-medium">{previewData.summary.subjectName}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Section</div>
                      <div className="mt-1 text-sm font-medium">{previewData.summary.sectionName}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Module Code</div>
                      <div className="mt-1 text-sm font-medium">{previewData.summary.moduleCode}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Academic Term</div>
                      <div className="mt-1 text-sm font-medium">{previewData.summary.termName}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 text-sm text-muted-foreground">
                  Complete the dropdown selections to preview the grade export summary.
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleDownload}
                disabled={isLoadingOptions || isLoadingPreview || !previewData}
              >
                {isLoadingPreview ? (
                  <>
                    <Loader2 size={18} className="mr-0 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <IconDownload size={18} className="mr-0" />
                    Download Grades
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
