'use client'

import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { IconLoader2 as Loader2 } from '@tabler/icons-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

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
import { Input } from '@/components/ui/input'
import { updateEducatorRetakeGrant } from '@/lib/supabase/educator-scores'
import { educatorRetakeFormSchema, type EducatorRetakeFormSchema } from '@/lib/validations/educator-retake.schema'

import type { EducatorScore } from '../data/schema'

interface AllowRetakeModalProps {
  score: EducatorScore
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => Promise<void>
}

// AllowRetakeModal - grant extra retake chances to a selected student
export function AllowRetakeModal({
  score,
  open,
  onOpenChange,
  onSaved,
}: AllowRetakeModalProps) {
  // ==================== FORM SETUP ====================
  const form = useForm<EducatorRetakeFormSchema>({
    resolver: zodResolver(educatorRetakeFormSchema),
    defaultValues: {
      retakeCount: String(score.grantedRetakeCount),
    },
  })

  useEffect(() => {
    form.reset({
      retakeCount: String(score.grantedRetakeCount),
    })
  }, [form, score.grantedRetakeCount, open])

  // ==================== HANDLE SUBMIT ====================
  // handleSubmit - save the extra retake grant
  const handleSubmit = async (values: EducatorRetakeFormSchema) => {
    try {
      await updateEducatorRetakeGrant({
        studentId: score.studentId,
        moduleRowId: score.moduleRowId,
        subjectId: score.subjectId,
        retakeCount: Number(values.retakeCount),
      })
      toast.success('Extra retake chances updated successfully.')
      await onSaved?.()
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update retake grant.')
    }
  }

  // ==================== RENDER ====================
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Allow Retake</DialogTitle>
          <DialogDescription>
            Grant extra retake chances for {score.studentName} in {score.moduleCode}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="rounded-lg border p-4 text-sm">
              <div className="font-medium">{score.studentName}</div>
              <div className="text-muted-foreground mt-1">{score.studentUserId}</div>
              <div className="text-muted-foreground mt-3">Current granted retakes: {score.grantedRetakeCount}</div>
            </div>

            <FormField
              control={form.control}
              name="retakeCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Retake Count</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Enter extra retake count"
                      value={field.value}
                      onChange={(event) => {
                        const nextValue = event.target.value.replace(/\D/g, '')
                        field.onChange(nextValue)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Retake'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
