'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { IconFileText, IconLoader2, IconUpload, IconX } from '@tabler/icons-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
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
import {
  createLearningMaterials,
  type LearningMaterialGroupRecord,
  type LearningMaterialTargetOption,
  formatLearningMaterialFileSize,
} from '@/lib/supabase/learning-materials'
import { uploadLearningMaterialsSchema } from '@/lib/validations/learning-materials.schema'

const uploadLearningMaterialFormSchema = uploadLearningMaterialsSchema.extend({
  selectionKeys: z.array(z.string()).min(1, 'Select at least one subject and section.'),
})

type UploadLearningMaterialFormValues = z.infer<typeof uploadLearningMaterialFormSchema>

interface UploadLearningMaterialsModalProps {
  targetOptions: LearningMaterialTargetOption[]
  onUploaded: (groups: LearningMaterialGroupRecord[]) => void
  trigger?: React.ReactNode | null
  defaultSelectionKeys?: string[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

// UploadLearningMaterialsModal - upload one or more files to one or more subject and section pairs
export function UploadLearningMaterialsModal({
  targetOptions,
  onUploaded,
  trigger,
  defaultSelectionKeys = [],
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: UploadLearningMaterialsModalProps) {
  // ==================== STATE ====================
  const [internalOpen, setInternalOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const open = controlledOpen ?? internalOpen
  const selectionKeySignature = useMemo(() => defaultSelectionKeys.join('|'), [defaultSelectionKeys])
  const form = useForm<UploadLearningMaterialFormValues>({
    resolver: zodResolver(uploadLearningMaterialFormSchema),
    defaultValues: {
      selectionKeys: defaultSelectionKeys,
      filesCount: 0,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        selectionKeys: selectionKeySignature ? selectionKeySignature.split('|') : [],
        filesCount: files.length,
      })
      return
    }

    if (files.length > 0) {
      setFiles([])
    }

    setIsDragging(false)

    form.reset({
      selectionKeys: selectionKeySignature ? selectionKeySignature.split('|') : [],
      filesCount: 0,
    })
  }, [files.length, form, open, selectionKeySignature])

  // handleOpenChange - sync controlled and uncontrolled modal state
  const handleOpenChange = (nextOpen: boolean) => {
    if (controlledOnOpenChange) {
      controlledOnOpenChange(nextOpen)
      return
    }

    setInternalOpen(nextOpen)
  }

  const helperText = useMemo(() => {
    if (files.length === 0) {
      return 'Drop valid files here or browse your files.'
    }

    return `${files.length} file(s) ready to upload.`
  }, [files.length])

  // updateFiles - keep file state and form validation in sync
  const updateFiles = (nextFiles: File[]) => {
    let mergedFiles: File[] = []

    setFiles((currentFiles) => {
      const fileMap = new Map(currentFiles.map((file) => [`${file.name}-${file.size}`, file]))

      nextFiles.forEach((file) => {
        fileMap.set(`${file.name}-${file.size}`, file)
      })

      mergedFiles = Array.from(fileMap.values())
      return mergedFiles
    })

    form.setValue('filesCount', mergedFiles.length, { shouldValidate: true })
  }

  // handleDrop - receive files from the dropzone
  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragging(false)
    updateFiles(Array.from(event.dataTransfer.files || []))
  }

  // handleSubmit - upload selected files to the selected targets
  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      const formData = new FormData()

      values.selectionKeys.forEach((selectionKey) => {
        formData.append('selectionKeys', selectionKey)
      })

      files.forEach((file) => {
        formData.append('files', file)
      })

      const groups = await createLearningMaterials(formData)
      onUploaded(groups)
      toast.success('Learning materials uploaded.')
      handleOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload learning materials.')
    }
  })

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogTrigger asChild>
        {trigger !== undefined ? trigger : (
          <Button type="button">
            <IconUpload size={16} />
            Upload Files
          </Button>
        )}
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="gap-0 p-0" desktopClassName="sm:max-w-[620px]">
        <ResponsiveDialogHeader className="border-b px-5 pt-6 pb-4">
          <ResponsiveDialogTitle>Upload Learning Materials</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Select valid files and assign them to one or more subject and section pairs.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <ResponsiveDialogBody className="max-h-[68vh] space-y-5 border-t border-b px-5 py-5">
              <FormField
                control={form.control}
                name="filesCount"
                render={() => (
                  <FormItem>
                    <FormLabel>Files</FormLabel>
                    <FormControl>
                      <label
                        className={
                          isDragging
                            ? 'flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-blue-500 bg-blue-500/5 px-4 py-6 text-center'
                            : 'flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 py-6 text-center'
                        }
                        onDragEnter={(event) => {
                          event.preventDefault()
                          setIsDragging(true)
                        }}
                        onDragLeave={(event) => {
                          event.preventDefault()
                          setIsDragging(false)
                        }}
                        onDragOver={(event) => {
                          event.preventDefault()
                        }}
                        onDrop={handleDrop}
                      >
                        <input
                          accept=".pptx,.ppsx,.ppt,.pdf,.docx,.doc,.rtf"
                          className="hidden"
                          multiple
                          type="file"
                          onChange={(event) => {
                            const nextFiles = Array.from(event.target.files || [])
                            updateFiles(nextFiles)
                            event.currentTarget.value = ''
                          }}
                        />
                        <div className="rounded-md border p-3">
                          <IconFileText size={28} className="text-muted-foreground" />
                        </div>
                        <div className="mt-4 space-y-1">
                          <p className="text-base font-medium">
                            {files.length === 0 ? 'Drop files here or browse your files' : helperText}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Multiple `.pptx`, `.ppsx`, `.ppt`, `.pdf`, `.docx`, `.doc`, and `.rtf` files are supported.
                          </p>
                        </div>
                      </label>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-base font-medium">Queued Files</p>
                  <p className="text-sm text-muted-foreground">
                    Review the files before uploading them to the database.
                  </p>
                </div>
                <div className="space-y-2 rounded-md border p-3">
                  {files.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No files selected.</p>
                  ) : (
                    files.map((file, index) => (
                      <div
                        key={`${file.name}-${file.size}-${index}`}
                        className="flex items-center justify-between gap-2 rounded-md border p-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatLearningMaterialFileSize(file.size)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            const nextFiles = files.filter((_, fileIndex) => fileIndex !== index)
                            setFiles(nextFiles)
                            form.setValue('filesCount', nextFiles.length, { shouldValidate: true })
                          }}
                        >
                          <IconX size={16} className="text-rose-500" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <FormField
                control={form.control}
                name="selectionKeys"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject and Section</FormLabel>
                    <div className="max-h-[320px] space-y-2 overflow-y-auto rounded-md border p-3">
                      {targetOptions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No subject and section targets found.</p>
                      ) : (
                        targetOptions.map((targetOption) => {
                          const checked = field.value.includes(targetOption.selectionKey)

                          return (
                            <label
                              key={targetOption.selectionKey}
                              className="flex cursor-pointer items-start gap-2 rounded-md border p-2"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(checkedState) => {
                                  const nextValues = checkedState
                                    ? [...field.value, targetOption.selectionKey]
                                    : field.value.filter((value) => value !== targetOption.selectionKey)

                                  field.onChange(nextValues)
                                }}
                              />
                              <div className="space-y-1">
                                <p className="text-sm font-medium">
                                  {targetOption.subjectCode} | {targetOption.subjectName}
                                </p>
                                <p className="text-xs text-muted-foreground">{targetOption.sectionName}</p>
                              </div>
                            </label>
                          )
                        })
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </ResponsiveDialogBody>
            <ResponsiveDialogFooter className="px-5 py-4">
                <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="w-full">
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                {form.formState.isSubmitting ? (
                  <>
                    <IconLoader2 className="animate-spin" size={16} />
                    Uploading...
                  </>
                ) : (
                  <>
                    <IconUpload size={16} />
                    Upload Files
                  </>
                )}
                </Button>
              </div>
            </ResponsiveDialogFooter>
          </form>
        </Form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
