'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { IconEdit, IconLoader2, IconUpload } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  type LearningMaterialFileRecord,
  type LearningMaterialGroupRecord,
  type LearningMaterialTargetOption,
  formatLearningMaterialFileSize,
  updateLearningMaterial,
} from '@/lib/supabase/learning-materials'
import { updateLearningMaterialSchema } from '@/lib/validations/learning-materials.schema'

const editLearningMaterialFormSchema = updateLearningMaterialSchema.extend({
  selectionKey: z.string().min(1, 'Select a subject and section.'),
})

type EditLearningMaterialFormValues = z.infer<typeof editLearningMaterialFormSchema>

interface EditLearningMaterialModalProps {
  group: LearningMaterialGroupRecord
  material: LearningMaterialFileRecord
  targetOptions: LearningMaterialTargetOption[]
  onUpdated: (groups: LearningMaterialGroupRecord[]) => void
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

// EditLearningMaterialModal - edit one learning material target or replace its file
export function EditLearningMaterialModal({
  group,
  material,
  targetOptions,
  onUpdated,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: EditLearningMaterialModalProps) {
  // ==================== STATE ====================
  const [internalOpen, setInternalOpen] = useState(false)
  const [replacementFile, setReplacementFile] = useState<File | null>(null)
  const open = controlledOpen ?? internalOpen
  const defaultSelectionKey = `${group.subjectId}:${group.sectionId}`
  const form = useForm<EditLearningMaterialFormValues>({
    resolver: zodResolver(editLearningMaterialFormSchema),
    defaultValues: {
      selectionKey: defaultSelectionKey,
      filesCount: 0,
    },
  })

  useEffect(() => {
    if (!open) {
      form.reset({
        selectionKey: defaultSelectionKey,
        filesCount: 0,
      })
      setReplacementFile(null)
    }
  }, [defaultSelectionKey, form, open])

  // handleOpenChange - sync controlled and uncontrolled modal state
  const handleOpenChange = (nextOpen: boolean) => {
    if (controlledOnOpenChange) {
      controlledOnOpenChange(nextOpen)
      return
    }

    setInternalOpen(nextOpen)
  }

  // handleSubmit - save learning material edits
  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      const formData = new FormData()
      formData.append('selectionKey', values.selectionKey)

      if (replacementFile) {
        formData.append('file', replacementFile)
      }

      const groups = await updateLearningMaterial(material.id, formData)
      onUpdated(groups)
      toast.success('Learning material updated.')
      handleOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update the learning material.')
    }
  })

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogTrigger asChild>
        {trigger || (
          <Button type="button" variant="outline" size="sm" className="cursor-pointer">
            <IconEdit size={16} />
            Edit
          </Button>
        )}
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="gap-0 p-0" desktopClassName="sm:max-w-[620px]">
        <ResponsiveDialogHeader className="border-b px-5 pt-6 pb-4">
          <ResponsiveDialogTitle>Edit Learning Material</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Reassign this file to another subject and section, or upload a replacement file.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <ResponsiveDialogBody className="max-h-[68vh] space-y-5 border-t border-b px-5 py-5">
              <div className="rounded-md border p-3">
                <p className="text-sm font-medium">{material.fileName}</p>
                <p className="text-xs text-muted-foreground">{formatLearningMaterialFileSize(material.fileSize)}</p>
              </div>

              <FormField
                control={form.control}
                name="selectionKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject and Section</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a subject and section" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {targetOptions.map((targetOption) => (
                          <SelectItem key={targetOption.selectionKey} value={targetOption.selectionKey}>
                            {targetOption.subjectCode} | {targetOption.subjectName} | {targetOption.sectionName}
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
                name="filesCount"
                render={() => (
                  <FormItem>
                    <FormLabel>Replace File</FormLabel>
                    <FormControl>
                      <Input
                        className="h-10"
                        accept=".pptx,.ppsx,.ppt,.pdf,.docx,.doc,.rtf"
                        type="file"
                        onChange={(event) => {
                          const nextFile = event.target.files?.[0] || null
                          setReplacementFile(nextFile)
                          form.setValue('filesCount', nextFile ? 1 : 0, { shouldValidate: true })
                        }}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Leave this empty to keep the current file.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {replacementFile ? (
                <div className="rounded-md border p-3">
                  <p className="text-sm font-medium">{replacementFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatLearningMaterialFileSize(replacementFile.size)}
                  </p>
                </div>
              ) : null}
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
                    Saving...
                  </>
                ) : (
                  <>
                    <IconUpload size={16} />
                    Save Changes
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
