'use client'

import { type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { IconClock, IconLoader2 as Loader2 } from '@tabler/icons-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import type { StudentQuizQuestion, StudentQuizSession } from '@/lib/supabase/student-quiz'
import {
  studentQuizFormSchema,
  type StudentQuizFormSchema,
} from '@/lib/validations/student-quiz.schema'

import { CheatingWarningDialog } from './cheating-warning-dialog'
import { SubmitQuizDialog } from './submit-quiz-dialog'

interface TakeQuizPageClientProps {
  session: StudentQuizSession
}

// shuffleArray - randomize array order
function shuffleArray<T>(items: T[]) {
  const clonedItems = [...items]

  for (let index = clonedItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const currentItem = clonedItems[index]
    clonedItems[index] = clonedItems[randomIndex]
    clonedItems[randomIndex] = currentItem
  }

  return clonedItems
}

// getOrderedQuestions - apply module shuffle rules
function getOrderedQuestions(session: StudentQuizSession) {
  if (!session.isShuffle) {
    return session.questions
  }

  return shuffleArray(session.questions).map((question) => {
    if (question.quizType !== 'multiple_choice') {
      return question
    }

    return {
      ...question,
      choices: shuffleArray(question.choices),
    }
  })
}

// formatRemainingTime - format seconds as hh:mm:ss
function formatRemainingTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')
}

// getTimerBadgeClassName - resolve timer color state
function getTimerBadgeClassName(secondsLeft: number, totalSeconds: number) {
  const safeTotalSeconds = totalSeconds <= 0 ? 1 : totalSeconds
  const ratio = secondsLeft / safeTotalSeconds

  if (ratio <= 0.2) {
    return 'rounded-md border-0 bg-rose-500/10 px-2.5 py-0.5 text-rose-500'
  }

  if (ratio <= 0.5) {
    return 'rounded-md border-0 bg-yellow-500/10 px-2.5 py-0.5 text-yellow-500'
  }

  return 'rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500'
}

// getQuestionStatusClassName - style question type badge
function getQuestionStatusClassName(quizType: StudentQuizQuestion['quizType']) {
  if (quizType === 'identification') {
    return 'rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-blue-500'
  }

  return 'rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500'
}

// buildDraftPayload - normalize answer values for saving
function buildDraftPayload(values: StudentQuizFormSchema) {
  return Object.entries(values.answers || {}).reduce<Record<string, string>>((result, [key, value]) => {
    result[key] = value || ''
    return result
  }, {})
}

// TakeQuizPageClient - render actual student quiz taking flow
export function TakeQuizPageClient({ session }: TakeQuizPageClientProps) {
  // ==================== SETUP ====================
  const router = useRouter()
  const orderedQuestionsRef = useRef(getOrderedQuestions(session))
  const lastSavedAnswersRef = useRef(JSON.stringify(session.existingAnswers || {}))
  const autoSubmitTriggeredRef = useRef(false)
  const timerDragStateRef = useRef({
    startPointerX: 0,
    startPointerY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
  })
  const [warningAttempts, setWarningAttempts] = useState(session.warningAttempts)
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const totalSeconds = session.timeLimitMinutes * 60

    if (!session.takenAt) {
      return totalSeconds
    }

    const takenAtTime = new Date(session.takenAt).getTime()

    if (Number.isNaN(takenAtTime)) {
      return totalSeconds
    }

    const elapsedSeconds = Math.floor((Date.now() - takenAtTime) / 1000)
    return Math.max(totalSeconds - elapsedSeconds, 0)
  })
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false)
  const [warningDialogOpen, setWarningDialogOpen] = useState(false)
  const [isTimerDragging, setIsTimerDragging] = useState(false)
  const [timerPosition, setTimerPosition] = useState({ x: 0, y: 0 })
  const form = useForm<StudentQuizFormSchema>({
    resolver: zodResolver(studentQuizFormSchema),
    defaultValues: {
      answers: session.existingAnswers || {},
    },
  })
  const watchedAnswers = form.watch('answers')
  const totalSeconds = session.timeLimitMinutes * 60
  const remainingAttempts = Math.max(session.cheatingAttempts - warningAttempts, 0)

  // ==================== SAVE ATTEMPT ====================
  const persistAttempt = async (mode: 'draft' | 'submit', nextWarningAttempts: number) => {
    const values = form.getValues()
    const response = await fetch(`/api/student/assessment/scores/${session.moduleRowId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode,
        answers: buildDraftPayload(values),
        warningAttempts: nextWarningAttempts,
      }),
    })

    const payload = (await response.json()) as {
      id?: number
      message?: string
      scoreId?: number
      status?: 'passed' | 'failed'
    }

    if (!response.ok) {
      throw new Error(payload.message || 'Failed to save your quiz.')
    }

    return payload
  }

  // ==================== HANDLE DRAFT SAVE ====================
  const handleDraftSave = async (nextWarningAttempts: number, options?: { silent?: boolean }) => {
    try {
      setIsSavingDraft(true)
      await persistAttempt('draft', nextWarningAttempts)
      lastSavedAnswersRef.current = JSON.stringify(buildDraftPayload(form.getValues()))

      if (!options?.silent) {
        toast.success('Progress saved.')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save draft.')
    } finally {
      setIsSavingDraft(false)
    }
  }

  // ==================== HANDLE SUBMIT ====================
  const handleSubmitQuiz = async () => {
    try {
      setIsSubmitting(true)
      const payload = await persistAttempt('submit', warningAttempts)
      const scoreId = payload.scoreId || payload.id

      if (!scoreId) {
        throw new Error('Submitted assessment did not return a result id.')
      }

      toast.success('Assessment submitted successfully.')
      router.push(`/student/assessment/take-quiz/result?scoreId=${scoreId}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit assessment.')
    } finally {
      setIsSubmitting(false)
      setSubmitDialogOpen(false)
    }
  }

  // ==================== HANDLE AUTO SUBMIT ====================
  const handleAutoSubmit = async () => {
    if (autoSubmitTriggeredRef.current) {
      return
    }

    autoSubmitTriggeredRef.current = true
    await handleSubmitQuiz()
  }

  // ==================== HANDLE TAB SWITCH ====================
  const handleVisibilityChange = async () => {
    if (document.visibilityState !== 'hidden' || isSubmitting) {
      return
    }

    const nextWarningAttempts = warningAttempts + 1
    setWarningAttempts(nextWarningAttempts)
    setWarningDialogOpen(true)
    await handleDraftSave(nextWarningAttempts, { silent: true })

    if (nextWarningAttempts >= session.cheatingAttempts) {
      toast.error('Cheating attempts exceeded. Submitting your quiz now.')
      await handleAutoSubmit()
    }
  }

  // ==================== TIMER EFFECT ====================
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSecondsLeft((currentValue) => Math.max(currentValue - 1, 0))
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [])

  // ==================== TIMER SUBMIT EFFECT ====================
  useEffect(() => {
    if (secondsLeft === 0) {
      void handleAutoSubmit()
    }
  }, [secondsLeft])

  // ==================== VISIBILITY EFFECT ====================
  useEffect(() => {
    const onVisibilityChange = () => {
      void handleVisibilityChange()
    }

    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [warningAttempts, isSubmitting])

  // ==================== DRAFT SAVE EFFECT ====================
  useEffect(() => {
    const serializedAnswers = JSON.stringify(buildDraftPayload({ answers: watchedAnswers || {} }))

    if (serializedAnswers === lastSavedAnswersRef.current) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      void handleDraftSave(warningAttempts, { silent: true })
    }, 800)

    return () => window.clearTimeout(timeoutId)
  }, [watchedAnswers, warningAttempts])

  // ==================== TIMER DRAG EFFECT ====================
  useEffect(() => {
    if (!isTimerDragging) {
      return
    }

    const handlePointerMove = (event: PointerEvent) => {
      const nextX = timerDragStateRef.current.startOffsetX + (event.clientX - timerDragStateRef.current.startPointerX)
      const nextY = timerDragStateRef.current.startOffsetY + (event.clientY - timerDragStateRef.current.startPointerY)

      setTimerPosition({
        x: nextX,
        y: nextY,
      })
    }

    const handlePointerUp = () => {
      setIsTimerDragging(false)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [isTimerDragging])

  // ==================== HANDLE TIMER DRAG ====================
  const handleTimerPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    timerDragStateRef.current = {
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      startOffsetX: timerPosition.x,
      startOffsetY: timerPosition.y,
    }
    setIsTimerDragging(true)
  }

  return (
    <>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 md:px-6">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>{session.subjectName}</CardTitle>
            <CardDescription>
              {session.sectionName} - {session.moduleCode} - {session.termName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{session.educatorName}</Badge>
              <Badge variant="outline">{session.educatorUserType}</Badge>
              <Badge variant="outline">
                {session.startDate} {session.startTime} - {session.endDate} {session.endTime}
              </Badge>
            </div>
            <div className="text-muted-foreground text-sm">
              Answer each question carefully. Your answers are saved while you work.
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form className="space-y-6">
            {orderedQuestionsRef.current.map((question, index) => (
              <Card key={question.id}>
                <CardHeader className="border-b">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle>Question {index + 1}</CardTitle>
                    <Badge className={getQuestionStatusClassName(question.quizType)}>
                      {question.quizType === 'multiple_choice' ? 'Multiple Choice' : 'Identification'}
                    </Badge>
                  </div>
                  <CardDescription>{question.question}</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {question.quizType === 'multiple_choice' ? (
                    <FormField
                      control={form.control}
                      name={`answers.${question.id}` as `answers.${string}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select your answer</FormLabel>
                          <FormControl>
                            <RadioGroup
                              value={field.value || ''}
                              onValueChange={field.onChange}
                              className="grid gap-3 md:grid-cols-2"
                            >
                              {question.choices.map((choice) => (
                                <label
                                  key={`${question.id}-${choice.key}`}
                                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                                    field.value === choice.value
                                      ? 'border-green-500/20 bg-green-500/10'
                                      : 'hover:bg-accent'
                                  }`}
                                >
                                  <RadioGroupItem value={choice.value} className="sr-only" />
                                  <div className="space-y-1">
                                    <div className="text-sm font-medium">{choice.key}</div>
                                    <div className="text-muted-foreground text-sm">{choice.value}</div>
                                  </div>
                                </label>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={form.control}
                      name={`answers.${question.id}` as `answers.${string}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your answer</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ''}
                              placeholder="Type your answer here"
                              autoComplete="off"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>
            ))}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={() => void handleDraftSave(warningAttempts)}
                disabled={isSavingDraft || isSubmitting}
              >
                {isSavingDraft ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Progress'
                )}
              </Button>
              <Button
                type="button"
                className="cursor-pointer"
                onClick={() => setSubmitDialogOpen(true)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Submit'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <div
        className={`fixed top-24 right-6 z-40 w-[280px] rounded-xl border bg-card p-4 shadow-lg ${isTimerDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{
          transform: `translate(${timerPosition.x}px, ${timerPosition.y}px)`,
        }}
        onPointerDown={handleTimerPointerDown}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Time Remaining</div>
            <div className="text-muted-foreground text-xs">Drag this timer anywhere while you answer</div>
          </div>
          <IconClock size={20} className="text-muted-foreground" />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <Badge className={getTimerBadgeClassName(secondsLeft, totalSeconds)}>
            {formatRemainingTime(secondsLeft)}
          </Badge>
          <span className="text-muted-foreground text-xs">
            Warning left: {Math.max(session.cheatingAttempts - warningAttempts, 0)}
          </span>
        </div>
      </div>

      <CheatingWarningDialog
        open={warningDialogOpen}
        remainingAttempts={remainingAttempts}
        onContinue={() => setWarningDialogOpen(false)}
      />

      <SubmitQuizDialog
        open={submitDialogOpen}
        isSubmitting={isSubmitting}
        onOpenChange={setSubmitDialogOpen}
        onSubmit={() => void handleSubmitQuiz()}
      />
    </>
  )
}
