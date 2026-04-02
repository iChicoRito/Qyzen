'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  IconCirclePlus,
  IconLoader2 as Loader2,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'

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
import { fetchQuizModuleOptions, type QuizModuleOption } from '@/lib/supabase/quizzes'
import { buildQuizPayload, quizFormSchema, type QuizFormSchema } from '@/lib/validations/quiz.schema'

import type { Quiz } from '../data/schema'
import { UploadQuizFileModal } from './upload-quiz-file-modal'

interface AddQuizModalProps {
  onAddQuiz?: (quiz: Quiz) => Promise<void> | void
  onUploadQuizzes?: (quizzes: Quiz[]) => Promise<void> | void
  trigger?: React.ReactNode
}

const defaultChoices: QuizFormSchema['choices'] = [
  { key: 'A', value: '' },
  { key: 'B', value: '' },
  { key: 'C', value: '' },
  { key: 'D', value: '' },
]

// AddQuizModal - create a new quiz row
export function AddQuizModal({ onAddQuiz, onUploadQuizzes, trigger }: AddQuizModalProps) {
  // ==================== STATE ====================
  const [open, setOpen] = useState(false)
  const [isLoadingModules, setIsLoadingModules] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [moduleOptions, setModuleOptions] = useState<QuizModuleOption[]>([])

  // ==================== FORM SETUP ====================
  const form = useForm<QuizFormSchema>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: {
      moduleId: '',
      quizType: 'multiple_choice',
      question: '',
      correctChoice: undefined,
      choices: defaultChoices,
      identificationAnswers: [{ value: '' }],
    },
  })

  const quizType = form.watch('quizType')
  const selectedModuleId = form.watch('moduleId')
  const selectedModule = moduleOptions.find((moduleOption) => String(moduleOption.id) === selectedModuleId)
  const identificationAnswers = useFieldArray({
    control: form.control,
    name: 'identificationAnswers',
  })

  // loadModuleOptions - fetch module dropdown options
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
    }
  }, [open])

  useEffect(() => {
    if (quizType === 'multiple_choice') {
      form.setValue('identificationAnswers', [{ value: '' }], { shouldValidate: false })
      return
    }

    form.setValue('correctChoice', undefined, { shouldValidate: false })
  }, [form, quizType])

  // handleOpenChange - reset the form when the modal closes
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)

    if (!nextOpen) {
      form.reset({
        moduleId: '',
        quizType: 'multiple_choice',
        question: '',
        correctChoice: undefined,
        choices: defaultChoices,
        identificationAnswers: [{ value: '' }],
      })
    }
  }

  // handleSubmit - create one local quiz row
  const handleSubmit = async (values: QuizFormSchema) => {
    if (!selectedModule) {
      toast.error('Select a module first.')
      return
    }

    try {
      setIsSubmitting(true)
      await new Promise((resolve) => setTimeout(resolve, 200))

      const payload = buildQuizPayload(values)
      const newQuiz: Quiz = {
        id: Date.now(),
        moduleRowId: selectedModule.id,
        moduleId: selectedModule.moduleId,
        moduleCode: selectedModule.moduleCode,
        termName: selectedModule.termName,
        subjectId: selectedModule.subjectId,
        subjectName: selectedModule.subjectName,
        sectionId: selectedModule.sectionId,
        sectionName: selectedModule.sectionName,
        question: payload.question,
        quizType: payload.quizType,
        choices: payload.choices,
        correctAnswer: payload.correctAnswer,
        correctAnswers: payload.correctAnswers,
      }

      await onAddQuiz?.(newQuiz)
      toast.success('Quiz created successfully.')
      handleOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create quiz.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ==================== RENDER ====================
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default" size="sm" className="cursor-pointer">
            <IconPlus size={18} />
            Add Quiz
          </Button>
        )}
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="border-0 bg-transparent p-0 shadow-none sm:max-w-[760px]">
        <DialogHeader className="sr-only">
          <DialogTitle>Add New Quiz</DialogTitle>
          <DialogDescription>Create a quiz for a selected module.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <Card className="mx-auto flex max-h-[calc(100vh-2rem)] w-full max-w-[760px] flex-col overflow-hidden">
              <CardHeader className="sticky top-0 z-10 border-b bg-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>Add New Quiz</CardTitle>
                    <CardDescription>
                      Create a quiz question for a module using multiple choice or identification.
                    </CardDescription>
                  </div>
                  <UploadQuizFileModal
                    onUploadQuizzes={onUploadQuizzes}
                    trigger={
                      <Button type="button" variant="outline" className="cursor-pointer">
                        <IconPlus size={18} className="mr-0" />
                        Upload File
                      </Button>
                    }
                  />
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-6 overflow-y-auto">
                <FormField
                  control={form.control}
                  name="moduleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Choose Module</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingModules}>
                        <FormControl>
                          <SelectTrigger className="w-full cursor-pointer">
                            <SelectValue
                              placeholder={isLoadingModules ? 'Loading modules...' : 'Select module'}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {moduleOptions.map((moduleOption) => (
                            <SelectItem
                              key={moduleOption.id}
                              value={String(moduleOption.id)}
                              className="cursor-pointer"
                            >
                              {moduleOption.moduleCode} | {moduleOption.subjectName} | {moduleOption.sectionName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedModule ? (
                        <div className="rounded-md border bg-card px-4 py-3">
                          <p className="font-medium">{selectedModule.moduleCode}</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedModule.subjectName} | {selectedModule.sectionName}
                          </p>
                          <p className="text-sm text-muted-foreground">{selectedModule.termName}</p>
                        </div>
                      ) : null}
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
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="correctChoice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Choices</FormLabel>
                          <FormControl>
                            <RadioGroup
                              value={field.value}
                              onValueChange={field.onChange}
                              className="space-y-0"
                            >
                              {defaultChoices.map((choice, index) => (
                                <div key={choice.key} className="rounded-md border p-3">
                                  <div className="flex items-center gap-3">
                                    <RadioGroupItem
                                      value={choice.key}
                                      id={`choice-${choice.key}`}
                                      className="cursor-pointer"
                                    />
                                    <span className="min-w-20 text-sm font-medium">
                                      Choice {choice.key}
                                    </span>
                                    <FormField
                                      control={form.control}
                                      name={`choices.${index}.value`}
                                      render={({ field: choiceField }) => (
                                        <FormItem className="flex-1">
                                          <FormControl>
                                            <Input
                                              placeholder="Enter choice here"
                                              {...choiceField}
                                            />
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
                  </div>
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
              </CardContent>

              <CardFooter className="sticky bottom-0 z-10 grid grid-cols-2 gap-2 border-t bg-card">
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
                  disabled={isSubmitting || isLoadingModules}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="mr-0 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>Create Quiz</>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
