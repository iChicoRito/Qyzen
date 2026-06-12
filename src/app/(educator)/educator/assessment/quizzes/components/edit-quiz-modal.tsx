'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  IconCirclePlus,
  IconEdit,
  IconLoader2 as Loader2,
  IconTrash,
} from '@tabler/icons-react'
import { useFieldArray, useForm } from 'react-hook-form'
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
  ResponsiveDialogTrigger,
} from '@/components/ui/responsive-dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { fetchQuizAssessmentOptions, type QuizAssessmentOption } from '@/lib/supabase/quizzes'
import { buildQuizPayload, quizFormSchema, type QuizFormSchema } from '@/lib/validations/quiz.schema'

import type { Quiz } from '../data/schema'

interface EditQuizModalProps {
  quiz: Quiz
  onUpdateQuiz?: (quiz: Quiz) => Promise<void> | void
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const defaultChoices: QuizFormSchema['choices'] = [
  { key: 'A', value: '' },
  { key: 'B', value: '' },
  { key: 'C', value: '' },
  { key: 'D', value: '' },
]

// getDefaultFormValues - build edit quiz defaults
function getDefaultFormValues(quiz: Quiz): QuizFormSchema {
  const selectedCorrectChoice = quiz.quizType === 'multiple_choice'
    ? quiz.choices.find((choice) => choice.value === quiz.correctAnswer)?.key
    : undefined

  return {
    assessmentId: String(quiz.assessmentRowId),
    quizType: quiz.quizType,
    question: quiz.question,
    correctChoice: selectedCorrectChoice,
    choices:
      quiz.quizType === 'multiple_choice'
        ? quiz.choices.map((choice) => ({
            key: choice.key,
            value: choice.value,
          }))
        : defaultChoices,
    identificationAnswers:
      quiz.quizType === 'identification'
        ? quiz.correctAnswers.map((answer) => ({ value: answer }))
        : [{ value: '' }],
  }
}

// EditQuizModal - update one quiz row
export function EditQuizModal({
  quiz,
  onUpdateQuiz,
  trigger,
  open,
  onOpenChange,
}: EditQuizModalProps) {
  // ==================== STATE ====================
  const [internalOpen, setInternalOpen] = useState(false)
  const [isLoadingAssessments, setIsLoadingAssessments] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [assessmentOptions, setAssessmentOptions] = useState<QuizAssessmentOption[]>([])
  const dialogOpen = open ?? internalOpen

  // ==================== FORM SETUP ====================
  const form = useForm<QuizFormSchema>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: getDefaultFormValues(quiz),
  })

  const quizType = form.watch('quizType')
  const selectedAssessmentId = form.watch('assessmentId')
  const selectedAssessment = assessmentOptions.find((assessmentOption) => String(assessmentOption.id) === selectedAssessmentId)
  const identificationAnswers = useFieldArray({
    control: form.control,
    name: 'identificationAnswers',
  })

  // loadAssessmentOptions - fetch assessment dropdown options
  const loadAssessmentOptions = async () => {
    try {
      setIsLoadingAssessments(true)
      const options = await fetchQuizAssessmentOptions()
      setAssessmentOptions(options)
      form.reset(getDefaultFormValues(quiz))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load assessment options.')
    } finally {
      setIsLoadingAssessments(false)
    }
  }

  useEffect(() => {
    if (dialogOpen) {
      loadAssessmentOptions()
      return
    }

    form.reset(getDefaultFormValues(quiz))
  }, [dialogOpen, form, quiz])

  useEffect(() => {
    if (quizType === 'multiple_choice') {
      form.setValue('identificationAnswers', [{ value: '' }], { shouldValidate: false })
      return
    }

    form.setValue('correctChoice', undefined, { shouldValidate: false })
  }, [form, quizType])

  // handleOpenChange - sync local and controlled dialog state
  const handleOpenChange = (nextOpen: boolean) => {
    setInternalOpen(nextOpen)
    onOpenChange?.(nextOpen)

    if (!nextOpen) {
      form.reset(getDefaultFormValues(quiz))
    }
  }

  // handleSubmit - update one quiz row
  const handleSubmit = async (values: QuizFormSchema) => {
    if (!selectedAssessment) {
      toast.error('Select an assessment first.')
      return
    }

    try {
      setIsSubmitting(true)
      await new Promise((resolve) => setTimeout(resolve, 200))

      const payload = buildQuizPayload(values)
      await onUpdateQuiz?.({
        ...quiz,
        assessmentRowId: selectedAssessment.id,
        assessmentId: selectedAssessment.assessmentId,
        assessmentCode: selectedAssessment.assessmentCode,
        termName: selectedAssessment.termName,
        subjectId: selectedAssessment.subjectId,
        subjectName: selectedAssessment.subjectName,
        sectionId: selectedAssessment.sectionId,
        sectionName: selectedAssessment.sectionName,
        question: payload.question,
        quizType: payload.quizType,
        choices: payload.choices,
        correctAnswer: payload.correctAnswer,
        correctAnswers: payload.correctAnswers,
      })

      toast.success('Quiz updated successfully.')
      handleOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update quiz.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ==================== RENDER ====================
  return (
    <ResponsiveDialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {trigger !== null ? (
        <ResponsiveDialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm" className="cursor-pointer">
              <IconEdit size={18} />
              Edit Quiz
            </Button>
          )}
        </ResponsiveDialogTrigger>
      ) : null}
      <ResponsiveDialogContent showCloseButton={false} className="gap-0 p-0" desktopClassName="sm:max-w-[760px]">
        <ResponsiveDialogHeader className="border-b">
          <ResponsiveDialogTitle>Edit Quiz</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Update the selected quiz details.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <ResponsiveDialogBody className="max-h-[68vh] space-y-6">
                <FormField
                  control={form.control}
                  name="assessmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Choose Assessment</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingAssessments}>
                        <FormControl>
                          <SelectTrigger className="w-full cursor-pointer">
                            <SelectValue
                              placeholder={isLoadingAssessments ? 'Loading assessments...' : 'Select assessment'}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {assessmentOptions.map((assessmentOption) => (
                            <SelectItem
                              key={assessmentOption.id}
                              value={String(assessmentOption.id)}
                              className="cursor-pointer"
                            >
                              {assessmentOption.assessmentCode} | {assessmentOption.subjectName} | {assessmentOption.sectionName}
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
                  name="quizType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quiz Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full cursor-pointer">
                            <SelectValue placeholder="Select quiz type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="multiple_choice" className="cursor-pointer">
                            Multiple Choice
                          </SelectItem>
                          <SelectItem value="identification" className="cursor-pointer">
                            Identification
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="question"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter the quiz question" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {quizType === 'multiple_choice' ? (
                  <FormField
                    control={form.control}
                    name="correctChoice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Choices</FormLabel>
                        <FormControl>
                          <RadioGroup value={field.value} onValueChange={field.onChange} className="space-y-3">
                            {defaultChoices.map((choice, index) => (
                              <div key={choice.key} className="rounded-md border p-4">
                                <div className="flex items-center gap-3">
                                  <RadioGroupItem
                                    value={choice.key}
                                    id={`edit-choice-${choice.key}`}
                                    className="cursor-pointer"
                                  />
                                  <span className="min-w-20 text-sm font-medium">Choice {choice.key}</span>
                                  <FormField
                                    control={form.control}
                                    name={`choices.${index}.value`}
                                    render={({ field: choiceField }) => (
                                      <FormItem className="flex-1">
                                        <FormControl>
                                          <Input placeholder="Enter choice here" {...choiceField} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              </div>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Correct Answers</p>
                        <p className="text-sm text-muted-foreground">
                          Add one or more accepted answers.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => identificationAnswers.append({ value: '' })}
                      >
                        <IconCirclePlus size={18} className="mr-0" />
                        Add Answer
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {identificationAnswers.fields.map((answer, index) => (
                        <div key={answer.id} className="flex items-end gap-2">
                          <FormField
                            control={form.control}
                            name={`identificationAnswers.${index}.value`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel>Answer {index + 1}</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter correct answer" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="cursor-pointer text-rose-500 hover:bg-rose-500/10 hover:text-rose-500"
                            disabled={identificationAnswers.fields.length === 1}
                            onClick={() => identificationAnswers.remove(index)}
                          >
                            <IconTrash size={18} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </ResponsiveDialogBody>

              <ResponsiveDialogFooter>
                <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  className="w-full cursor-pointer"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="w-full cursor-pointer"
                  disabled={isSubmitting || isLoadingAssessments}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="mr-0 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <IconEdit size={18} className="mr-0" />
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

