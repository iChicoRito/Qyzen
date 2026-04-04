'use client'

import { useEffect, useState } from 'react'
import {
  IconDownload,
  IconFileSpreadsheet,
  IconLoader2 as Loader2,
  IconUpload,
  IconX,
} from '@tabler/icons-react'
import ExcelJS from 'exceljs'
import { z } from 'zod'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  fetchEnrollmentStudents,
  fetchEnrollmentSubjects,
  type BulkCreateEnrollmentRow,
  type EnrollmentStudentOption,
  type EnrollmentSubjectOption,
} from '@/lib/supabase/enrollments'
import {
  bulkEnrollmentSchema,
  enrollmentUploadHeaders,
  enrollmentUploadRowSchema,
  normalizeEnrollmentUploadValue,
} from '@/lib/validations/enrollment-upload.schema'

interface UploadEnrollmentsFileModalProps {
  onUploadEnrollments?: (rows: BulkCreateEnrollmentRow[]) => Promise<void> | void
  trigger?: React.ReactNode
}

interface ParsedUploadFile {
  name: string
  size: number
  file: File
}

interface UploadEnrollmentRowRecord {
  student_user_id?: string
  subject_code?: string
  section_name?: string
  status?: string
}

// buildStudentLookup - map students by user id
function buildStudentLookup(students: EnrollmentStudentOption[]) {
  return new Map(students.map((student) => [student.userId.toLowerCase(), student]))
}

// buildSubjectLookup - map subjects by subject code and section name
function buildSubjectLookup(subjects: EnrollmentSubjectOption[]) {
  return new Map(
    subjects.map((subject) => [
      `${subject.subjectCode.toLowerCase()}::${subject.section.name.toLowerCase()}`,
      subject,
    ])
  )
}

// isEmptyUploadRow - detect fully blank spreadsheet rows
function isEmptyUploadRow(row: UploadEnrollmentRowRecord) {
  return enrollmentUploadHeaders.every((header) => !normalizeEnrollmentUploadValue(row[header]))
}

// UploadEnrollmentsFileModal - upload multiple enrollment rows from xlsx files
export function UploadEnrollmentsFileModal({
  onUploadEnrollments,
  trigger,
}: UploadEnrollmentsFileModalProps) {
  // ==================== STATE ====================
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<ParsedUploadFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [studentOptions, setStudentOptions] = useState<EnrollmentStudentOption[]>([])
  const [subjectOptions, setSubjectOptions] = useState<EnrollmentSubjectOption[]>([])

  const queuedFilesLabel =
    files.length === 0 ? 'Drop .xlsx files here or browse your files' : `${files.length} file(s) ready`

  // loadOptions - fetch students and educator subjects for validation
  const loadOptions = async () => {
    try {
      setIsLoadingOptions(true)
      const [students, subjects] = await Promise.all([fetchEnrollmentStudents(), fetchEnrollmentSubjects()])
      setStudentOptions(students)
      setSubjectOptions(subjects)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load enrollment options.')
    } finally {
      setIsLoadingOptions(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadOptions()
      return
    }

    setFiles([])
    setIsDragging(false)
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
        fileMap.set(`${file.name}-${file.size}`, {
          name: file.name,
          size: file.size,
          file,
        })
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

  // handleDownloadTemplate - download the xlsx template
  const handleDownloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Enrollment Upload Template')

    worksheet.mergeCells('A1:D1')
    worksheet.getCell('A1').value = 'Qyzen Enrollment Upload Template'
    worksheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } }
    worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' }
    worksheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '171717' },
    }

    const headerRow = worksheet.getRow(2)
    enrollmentUploadHeaders.forEach((header, index) => {
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

    for (let rowIndex = 3; rowIndex <= 12; rowIndex += 1) {
      const row = worksheet.getRow(rowIndex)

      enrollmentUploadHeaders.forEach((_, columnIndex) => {
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
      { key: 'student_user_id', width: 18 },
      { key: 'subject_code', width: 18 },
      { key: 'section_name', width: 24 },
      { key: 'status', width: 16 },
    ]
    worksheet.views = [{ state: 'frozen', ySplit: 2 }]

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'enrollment-upload-template.xlsx'
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

    return XLSX.utils.sheet_to_json<UploadEnrollmentRowRecord>(worksheet, {
      defval: '',
      range: 1,
    })
  }

  // validateUploadRow - validate and resolve one spreadsheet row
  const validateUploadRow = (
    fileName: string,
    rowIndex: number,
    row: UploadEnrollmentRowRecord,
    studentLookup: Map<string, EnrollmentStudentOption>,
    subjectLookup: Map<string, EnrollmentSubjectOption>
  ) => {
    const parsedRow = enrollmentUploadRowSchema.parse({
      student_user_id: normalizeEnrollmentUploadValue(row.student_user_id),
      subject_code: normalizeEnrollmentUploadValue(row.subject_code),
      section_name: normalizeEnrollmentUploadValue(row.section_name),
      status: normalizeEnrollmentUploadValue(row.status).toLowerCase(),
    })
    const student = studentLookup.get(parsedRow.student_user_id.toLowerCase())

    if (!student) {
      throw new Error(
        `File "${fileName}", row ${rowIndex + 2}: student_user_id "${parsedRow.student_user_id}" was not found.`
      )
    }

    const subjectKey = `${parsedRow.subject_code.toLowerCase()}::${parsedRow.section_name.toLowerCase()}`
    const subject = subjectLookup.get(subjectKey)

    if (!subject) {
      throw new Error(
        `File "${fileName}", row ${rowIndex + 2}: subject_code "${parsedRow.subject_code}" with section "${parsedRow.section_name}" was not found.`
      )
    }

    return {
      studentId: student.id,
      subjectId: subject.id,
      status: parsedRow.status,
    } satisfies BulkCreateEnrollmentRow
  }

  // handleUpload - parse and upload enrollment rows
  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Select at least one .xlsx file.')
      return
    }

    if (studentOptions.length === 0 || subjectOptions.length === 0) {
      toast.error('Enrollment options are not available for upload.')
      return
    }

    try {
      setIsUploading(true)

      const studentLookup = buildStudentLookup(studentOptions)
      const subjectLookup = buildSubjectLookup(subjectOptions)
      const uploadedRows: BulkCreateEnrollmentRow[] = []

      for (const uploadFile of files) {
        const rows = await parseFileRows(uploadFile.file)

        rows.forEach((row, rowIndex) => {
          if (isEmptyUploadRow(row)) {
            return
          }

          try {
            const parsedRow = validateUploadRow(
              uploadFile.name,
              rowIndex,
              row,
              studentLookup,
              subjectLookup
            )
            uploadedRows.push(parsedRow)
          } catch (error) {
            if (error instanceof z.ZodError) {
              const firstIssue = error.issues[0]
              throw new Error(
                `File "${uploadFile.name}", row ${rowIndex + 2}: ${firstIssue?.message || 'Invalid row.'}`
              )
            }

            throw error
          }
        })
      }

      if (uploadedRows.length === 0) {
        toast.error('Add at least one enrollment row before uploading.')
        return
      }

      const payload = bulkEnrollmentSchema.parse({ rows: uploadedRows })
      await onUploadEnrollments?.(payload.rows)
      toast.success(`${payload.rows.length} enrollment row(s) uploaded successfully.`)
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload enrollment files.')
    } finally {
      setIsUploading(false)
    }
  }

  // ==================== RENDER ====================
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="cursor-pointer">
            <IconUpload size={18} />
            Upload File
          </Button>
        )}
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="border-0 bg-transparent p-0 shadow-none sm:max-w-[760px]">
        <DialogHeader className="sr-only">
          <DialogTitle>Upload Enrollment Files</DialogTitle>
          <DialogDescription>Upload one or more xlsx files for bulk enrollment creation.</DialogDescription>
        </DialogHeader>

        <Card className="mx-auto flex max-h-[calc(100vh-2rem)] w-full max-w-[760px] flex-col overflow-hidden">
          <CardHeader className="sticky top-0 z-10 border-b bg-card">
            <CardTitle>Upload Enrollment Files</CardTitle>
            <CardDescription>
              Drop one or more xlsx files and use the template so the upload matches the educator enrollment fields.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 space-y-6 overflow-y-auto">
            <div className="flex items-center justify-between gap-3 rounded-md border p-4">
              <div>
                <p className="font-medium">Download Template</p>
                <p className="text-sm text-muted-foreground">
                  Use the provided format before uploading your files.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={handleDownloadTemplate}
              >
                <IconDownload size={18} className="mr-0" />
                Download Format
              </Button>
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
              <p className="font-medium">{queuedFilesLabel}</p>
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
                <div className="rounded-md border px-4 py-3 text-sm text-muted-foreground">
                  No files selected.
                </div>
              ) : (
                files.map((file) => (
                  <div key={`${file.name}-${file.size}`} className="flex items-center justify-between rounded-md border px-4 py-3">
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
                student_user_id, subject_code, section_name, status
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Match `student_user_id` to the student account ID and use `active` or `inactive` for status.
              </p>
            </div>
          </CardContent>

          <CardFooter className="sticky bottom-0 z-10 grid grid-cols-2 gap-2 border-t bg-card">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full cursor-pointer" disabled={isUploading}>
              Cancel
            </Button>
            <Button
              type="button"
              className="w-full cursor-pointer"
              onClick={handleUpload}
              disabled={isUploading || isLoadingOptions}
            >
              {isUploading ? (
                <>
                  <Loader2 size={18} className="mr-0 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <IconUpload size={18} className="mr-0" />
                  Upload File
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
