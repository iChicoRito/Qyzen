'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  IconDownload,
  IconChevronDown,
  IconFileSpreadsheet,
  IconLoader2 as Loader2,
  IconTrash,
  IconUpload,
  IconX,
} from '@tabler/icons-react'
import ExcelJS from 'exceljs'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from '@/components/ui/responsive-dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { fetchQuizModuleOptions, type QuizModuleOption } from '@/lib/supabase/quizzes'

import type { Quiz } from '../data/schema'

interface UploadQuizFileModalProps {
  onUploadQuizzes?: (quizzes: Quiz[]) => Promise<void> | void
  trigger?: React.ReactNode
}

interface UploadRow {
  quiz_type?: string
  question?: string
  choice_a?: string
  choice_b?: string
  choice_c?: string
  choice_d?: string
  correct_answer?: string
  correct_answers?: string
}

const templateHeaders = [
  'quiz_type',
  'question',
  'choice_a',
  'choice_b',
  'choice_c',
  'choice_d',
  'correct_answer',
  'correct_answers',
] as const

// normalizeValue - clean string cell values
function normalizeValue(value: unknown) {
  return String(value ?? '').trim()
}

// isEmptyUploadRow - detect fully blank spreadsheet rows
function isEmptyUploadRow(row: UploadRow) {
  return templateHeaders.every((header) => !normalizeValue(row[header]))
}

// buildTemplateRows - create sample rows for the xlsx template
function buildTemplateRows() {
  return [
    {
      quiz_type: 'multiple_choice',
      question: 'Placeholder: What is the capital of France?',
      choice_a: 'Berlin',
      choice_b: 'Madrid',
      choice_c: 'Paris',
      choice_d: 'Rome',
      correct_answer: 'Paris',
      correct_answers: '',
    },
    {
      quiz_type: 'identification',
      question: 'Placeholder: Name a primary color.',
      choice_a: '',
      choice_b: '',
      choice_c: '',
      choice_d: '',
      correct_answer: '',
      correct_answers: 'red|blue|yellow',
    },
  ] as const
}

// formatModuleSelectionLabel - create a readable label for module choices
function formatModuleSelectionLabel(moduleOption: QuizModuleOption) {
  return `${moduleOption.subjectName} | ${moduleOption.sectionName}`
}

// formatModuleSelectionMeta - create supporting text for a module choice
function formatModuleSelectionMeta(moduleOption: QuizModuleOption) {
  return `${moduleOption.moduleCode} | ${moduleOption.termName}`
}

// UploadQuizFileModal - upload quiz rows from xlsx files
export function UploadQuizFileModal({ onUploadQuizzes, trigger }: UploadQuizFileModalProps) {
  // ==================== STATE ====================
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isLoadingModules, setIsLoadingModules] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [moduleOptions, setModuleOptions] = useState<QuizModuleOption[]>([])
  const [selectedModuleIds, setSelectedModuleIds] = useState<number[]>([])

  const acceptedLabel = useMemo(
    () => (files.length === 0 ? 'Drop .xlsx files here or browse your files' : `${files.length} file(s) ready`),
    [files.length]
  )
  const selectedModules = useMemo(
    () => moduleOptions.filter((moduleOption) => selectedModuleIds.includes(moduleOption.id)),
    [moduleOptions, selectedModuleIds]
  )
  const selectedModulesLabel = useMemo(() => {
    if (selectedModules.length === 0) {
      return 'Select one or more modules'
    }

    return `${selectedModules.length} module${selectedModules.length > 1 ? 's' : ''} selected`
  }, [selectedModules.length])

  // loadModuleOptions - fetch modules used for upload matching
  const loadModuleOptions = async () => {
    try {
      setIsLoadingModules(true)
      const options = await fetchQuizModuleOptions()
      setModuleOptions(options)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load module options.')
    } finally {
      setIsLoadingModules(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadModuleOptions()
      return
    }

    setFiles([])
    setIsDragging(false)
    setSelectedModuleIds([])
  }, [open])

  // handleFileSelection - merge selected xlsx files
  const handleFileSelection = (nextFiles: FileList | File[]) => {
    const normalizedFiles = Array.from(nextFiles).filter((file) => file.name.toLowerCase().endsWith('.xlsx'))

    if (normalizedFiles.length === 0) {
      toast.error('Only .xlsx files are supported.')
      return
    }

    setFiles((currentFiles) => {
      const fileMap = new Map(currentFiles.map((file) => [`${file.name}-${file.size}`, file]))

      normalizedFiles.forEach((file) => {
        fileMap.set(`${file.name}-${file.size}`, file)
      })

      return Array.from(fileMap.values())
    })
  }

  // handleRemoveFile - remove one queued file
  const handleRemoveFile = (fileName: string, fileSize: number) => {
    setFiles((currentFiles) =>
      currentFiles.filter((file) => !(file.name === fileName && file.size === fileSize))
    )
  }

  // handleModuleCheckedChange - toggle selected upload modules
  const handleModuleCheckedChange = (moduleId: number, checked: boolean) => {
    setSelectedModuleIds((currentIds) => {
      if (checked) {
        if (currentIds.includes(moduleId)) {
          return currentIds
        }

        return [...currentIds, moduleId]
      }

      return currentIds.filter((currentId) => currentId !== moduleId)
    })
  }

  // handleModuleRemove - remove a selected module from the upload target list
  const handleModuleRemove = (moduleId: number) => {
    setSelectedModuleIds((currentIds) => currentIds.filter((currentId) => currentId !== moduleId))
  }

  // handleDownloadTemplate - download the xlsx template
  const handleDownloadTemplate = async () => {
    const templateRows = buildTemplateRows()

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Quiz Upload Template')

    worksheet.mergeCells('A1:H1')
    worksheet.getCell('A1').value = 'Qyzen Quiz Template'
    worksheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } }
    worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' }
    worksheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '171717' },
    }

    const headerRow = worksheet.getRow(2)
    templateHeaders.forEach((header, index) => {
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

    templateRows.forEach((templateRow, rowOffset) => {
      const row = worksheet.getRow(rowOffset + 3)

      templateHeaders.forEach((header, columnIndex) => {
        const cell = row.getCell(columnIndex + 1)
        cell.value = templateRow[header]
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFF' },
        }
        cell.border = {
          top: { style: 'thin', color: { argb: 'E4E4E7' } },
          left: { style: 'thin', color: { argb: 'E4E4E7' } },
          bottom: { style: 'thin', color: { argb: 'E4E4E7' } },
          right: { style: 'thin', color: { argb: 'E4E4E7' } },
        }
      })
    })

    for (let rowIndex = templateRows.length + 3; rowIndex <= templateRows.length + 12; rowIndex += 1) {
      const row = worksheet.getRow(rowIndex)

      templateHeaders.forEach((_, columnIndex) => {
        const cell = row.getCell(columnIndex + 1)
        cell.value = ''
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFF' },
        }
        cell.border = {
          top: { style: 'thin', color: { argb: 'E4E4E7' } },
          left: { style: 'thin', color: { argb: 'E4E4E7' } },
          bottom: { style: 'thin', color: { argb: 'E4E4E7' } },
          right: { style: 'thin', color: { argb: 'E4E4E7' } },
        }
      })
    }

    worksheet.columns = [
      { key: 'quiz_type', width: 20 },
      { key: 'question', width: 42 },
      { key: 'choice_a', width: 28 },
      { key: 'choice_b', width: 28 },
      { key: 'choice_c', width: 28 },
      { key: 'choice_d', width: 28 },
      { key: 'correct_answer', width: 28 },
      { key: 'correct_answers', width: 32 },
    ]
    worksheet.views = [{ state: 'frozen', ySplit: 2 }]

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'quiz-upload-template.xlsx'
    link.click()
    URL.revokeObjectURL(url)
  }

  // parseFileRows - read one xlsx file into row objects
  const parseFileRows = async (file: File) => {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]

    if (!sheetName) {
      return []
    }

    const worksheet = workbook.Sheets[sheetName]

    if (!worksheet) {
      return []
    }

    return XLSX.utils.sheet_to_json<UploadRow>(worksheet, {
      defval: '',
      range: 1,
    })
  }

  // handleUpload - parse and upload quiz rows
  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Select at least one .xlsx file.')
      return
    }

    if (moduleOptions.length === 0) {
      toast.error('No modules are available for upload.')
      return
    }

    if (selectedModules.length === 0) {
      toast.error('Select at least one subject and section module.')
      return
    }

    try {
      setIsUploading(true)

      const uploadedQuizzes: Quiz[] = []
      let nextQuizId = Date.now()

      for (const file of files) {
        const rows = await parseFileRows(file)

        rows.forEach((row: UploadRow, rowIndex: number) => {
          if (isEmptyUploadRow(row)) {
            return
          }

          const quizTypeValue = normalizeValue(row.quiz_type).toLowerCase()

          if (quizTypeValue !== 'multiple_choice' && quizTypeValue !== 'identification') {
            throw new Error(
              `File "${file.name}", row ${rowIndex + 2}: quiz_type must be multiple_choice or identification.`
            )
          }

          const question = normalizeValue(row.question)

          if (!question) {
            throw new Error(`File "${file.name}", row ${rowIndex + 2}: question is required.`)
          }

          selectedModules.forEach((matchedModule) => {
            if (quizTypeValue === 'multiple_choice') {
              const choiceValues = [
                normalizeValue(row.choice_a),
                normalizeValue(row.choice_b),
                normalizeValue(row.choice_c),
                normalizeValue(row.choice_d),
              ]

              if (choiceValues.some((choice) => !choice)) {
                throw new Error(
                  `File "${file.name}", row ${rowIndex + 2}: all multiple choice fields are required.`
                )
              }

              const correctAnswer = normalizeValue(row.correct_answer)

              if (!correctAnswer) {
                throw new Error(
                  `File "${file.name}", row ${rowIndex + 2}: correct_answer is required for multiple_choice.`
                )
              }

              nextQuizId += 1
              uploadedQuizzes.push({
                id: nextQuizId,
                moduleRowId: matchedModule.id,
                moduleId: matchedModule.moduleId,
                moduleCode: matchedModule.moduleCode,
                termName: matchedModule.termName,
                subjectId: matchedModule.subjectId,
                subjectName: matchedModule.subjectName,
                sectionId: matchedModule.sectionId,
                sectionName: matchedModule.sectionName,
                question,
                quizType: 'multiple_choice',
                choices: [
                  { key: 'A', value: choiceValues[0] },
                  { key: 'B', value: choiceValues[1] },
                  { key: 'C', value: choiceValues[2] },
                  { key: 'D', value: choiceValues[3] },
                ],
                correctAnswer,
                correctAnswers: [correctAnswer],
              })
              return
            }

            const correctAnswers = normalizeValue(row.correct_answers)
              .split('|')
              .map((value) => value.trim())
              .filter(Boolean)

            if (correctAnswers.length === 0) {
              throw new Error(
                `File "${file.name}", row ${rowIndex + 2}: correct_answers is required for identification.`
              )
            }

            nextQuizId += 1
            uploadedQuizzes.push({
              id: nextQuizId,
              moduleRowId: matchedModule.id,
              moduleId: matchedModule.moduleId,
              moduleCode: matchedModule.moduleCode,
              termName: matchedModule.termName,
              subjectId: matchedModule.subjectId,
              subjectName: matchedModule.subjectName,
              sectionId: matchedModule.sectionId,
              sectionName: matchedModule.sectionName,
              question,
              quizType: 'identification',
              choices: [],
              correctAnswer: JSON.stringify(correctAnswers),
              correctAnswers,
            })
          })
        })
      }

      if (uploadedQuizzes.length === 0) {
        toast.error('Add at least one quiz row before uploading.')
        return
      }

      await onUploadQuizzes?.(uploadedQuizzes)
      toast.success(`${uploadedQuizzes.length} quiz row(s) uploaded successfully.`)
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload quiz files.')
    } finally {
      setIsUploading(false)
    }
  }

  // ==================== RENDER ====================
  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="cursor-pointer">
            <IconUpload size={18} />
            Upload File
          </Button>
        )}
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent showCloseButton={false} className="gap-0 p-0" desktopClassName="sm:max-w-[760px]">
        <ResponsiveDialogHeader className="border-b">
          <ResponsiveDialogTitle>Upload Quiz Files</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Drop one or more xlsx files, choose the target modules, and use the template so the upload matches the manual quiz fields.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="max-h-[68vh] space-y-6">
          <div className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Download Template</p>
              <p className="text-sm text-muted-foreground">
                Use the provided format before uploading your files.
              </p>
            </div>
            <Button type="button" variant="outline" className="cursor-pointer" onClick={handleDownloadTemplate}>
              <IconDownload size={18} className="mr-0" />
              Download Template
            </Button>
          </div>

          <div className="space-y-4 rounded-md border p-4">
            <div className="space-y-1">
              <p className="font-medium">Target Module</p>
              <p className="text-sm text-muted-foreground">
                Select every subject and section module that should receive the uploaded quiz rows.
              </p>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" className="w-full justify-between">
                  <span className="truncate text-left">{selectedModulesLabel}</span>
                  <IconChevronDown size={18} className="text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="z-50 max-h-72 w-[var(--radix-popover-trigger-width)] overflow-y-auto overscroll-contain p-4"
                align="start"
                sideOffset={6}
                onWheelCapture={(event) => {
                  const target = event.currentTarget
                  const maxScrollTop = target.scrollHeight - target.clientHeight

                  if (maxScrollTop <= 0) {
                    return
                  }

                  event.stopPropagation()
                  event.preventDefault()
                  target.scrollTop = Math.max(0, Math.min(maxScrollTop, target.scrollTop + event.deltaY))
                }}
              >
                <div className="space-y-2">
                  {isLoadingModules ? (
                    <p className="text-sm text-muted-foreground">Loading module options...</p>
                  ) : moduleOptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No modules available.</p>
                  ) : (
                    moduleOptions.map((moduleOption) => {
                      const isChecked = selectedModuleIds.includes(moduleOption.id)

                      return (
                        <label
                          key={moduleOption.id}
                          className="flex cursor-pointer items-start gap-3 rounded-md border p-3"
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) =>
                              handleModuleCheckedChange(moduleOption.id, Boolean(checked))
                            }
                            className="mt-0.5 cursor-pointer"
                          />
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="text-sm font-medium uppercase">
                              {formatModuleSelectionLabel(moduleOption)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatModuleSelectionMeta(moduleOption)}
                            </p>
                          </div>
                        </label>
                      )
                    })
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {selectedModules.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Selected Modules</p>
                <div className="rounded-md border bg-card">
                  {selectedModules.map((moduleOption, index) => (
                    <div key={moduleOption.id}>
                      <div className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
                        <div className="min-w-0 space-y-1">
                          <p className="font-medium uppercase">{moduleOption.subjectName}</p>
                          <Badge
                            variant="outline"
                            className="rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-blue-500"
                          >
                            {moduleOption.sectionName}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {moduleOption.moduleCode} | {moduleOption.termName}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-rose-500 hover:bg-rose-500/10 hover:text-rose-500"
                          onClick={() => handleModuleRemove(moduleOption.id)}
                          aria-label={`Remove ${moduleOption.subjectName} ${moduleOption.sectionName}`}
                        >
                          <IconTrash size={18} />
                        </Button>
                      </div>
                      {index < selectedModules.length - 1 ? <div className="border-b" /> : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-md border px-4 py-3 text-sm text-muted-foreground">
                No target modules selected.
              </div>
            )}
          </div>

          <label
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center ${
              isDragging ? 'border-primary bg-accent/40' : 'border-border'
            }`}
            onDragOver={(event) => {
              event.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={(event) => {
              event.preventDefault()
              setIsDragging(false)
            }}
            onDrop={(event) => {
              event.preventDefault()
              setIsDragging(false)
              handleFileSelection(event.dataTransfer.files)
            }}
          >
            <input
              type="file"
              accept=".xlsx"
              multiple
              className="hidden"
              onChange={(event) => {
                if (event.target.files) {
                  handleFileSelection(event.target.files)
                  event.target.value = ''
                }
              }}
            />
            <IconFileSpreadsheet size={40} className="mb-4 text-muted-foreground" />
            <p className="font-medium">{acceptedLabel}</p>
            <p className="mt-1 text-sm text-muted-foreground">Multiple xlsx files are supported.</p>
          </label>

          <div className="space-y-3">
            <div>
              <p className="font-medium">Queued Files</p>
              <p className="text-sm text-muted-foreground">
                Review the files before uploading them to the database.
              </p>
            </div>
            {files.length === 0 ? (
              <div className="rounded-md border px-4 py-3 text-sm text-muted-foreground">No files selected.</div>
            ) : (
              files.map((file) => (
                <div
                  key={`${file.name}-${file.size}`}
                  className="flex items-center justify-between rounded-md border px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="cursor-pointer text-rose-500 hover:bg-rose-500/10 hover:text-rose-500"
                    onClick={() => handleRemoveFile(file.name, file.size)}
                  >
                    <IconX size={18} />
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="rounded-md border bg-card px-4 py-3">
            <p className="font-medium">Required Template Columns</p>
            <p className="mt-2 text-sm text-muted-foreground">
              quiz_type, question, choice_a, choice_b, choice_c, choice_d, correct_answer, correct_answers
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Use `correct_answer` for multiple choice questions and use `correct_answers` with `|` separators for
              identification questions.
            </p>
          </div>
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter>
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full cursor-pointer" disabled={isUploading}>
              Cancel
            </Button>
            <Button
              type="button"
              className="w-full cursor-pointer"
              onClick={handleUpload}
              disabled={isUploading || isLoadingModules}
            >
              {isUploading ? (
                <>
                  <Loader2 size={18} className="mr-0 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <IconUpload size={18} className="mr-0" />
                  Upload Quizzes
                </>
              )}
            </Button>
          </div>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
