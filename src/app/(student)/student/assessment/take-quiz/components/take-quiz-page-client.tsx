'use client'

import { type PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  IconClock,
  IconEye,
  IconEyeOff,
  IconLoader2 as Loader2,
} from '@tabler/icons-react'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useIsMobile } from '@/hooks/use-mobile'
import type { StudentQuizQuestion, StudentQuizSession } from '@/lib/supabase/student-quiz'
import {
  studentQuizFormSchema,
  type StudentQuizFormInput,
  type StudentQuizFormSchema,
} from '@/lib/validations/student-quiz.schema'

import { CheatingWarningDialog } from './cheating-warning-dialog'
import { SubmitQuizDialog } from './submit-quiz-dialog'
import { TimesUpDialog } from './times-up-dialog'

interface TakeQuizPageClientProps {
  session: StudentQuizSession
}

const TIMER_TOP_OFFSET = 96
const TIMER_RIGHT_OFFSET = 24
const TIMER_VIEWPORT_PADDING = 16
const MOBILE_TIMER_TOP_OFFSET = 84
const MOBILE_TIMER_RIGHT_OFFSET = 12
const MOBILE_TIMER_VIEWPORT_PADDING = 12
const QUIZ_HINT_MIN_DURATION = 3000

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

// getRandomHintMoments - create sorted random hint trigger times
function getRandomHintMoments(totalSeconds: number, hintCount: number) {
  if (totalSeconds <= 10 || hintCount <= 0) {
    return []
  }

  const safeHintCount = Math.min(hintCount, totalSeconds)
  const startBoundary = Math.min(15, Math.max(3, Math.floor(totalSeconds * 0.15)))
  const endBoundary = Math.min(15, Math.max(3, Math.floor(totalSeconds * 0.15)))
  const minSecond = startBoundary
  const maxSecond = Math.max(minSecond, totalSeconds - endBoundary)
  const usedMoments = new Set<number>()

  while (usedMoments.size < safeHintCount) {
    const randomSecond =
      Math.floor(Math.random() * (maxSecond - minSecond + 1)) + minSecond
    usedMoments.add(randomSecond)
  }

  return Array.from(usedMoments).sort((leftValue, rightValue) => leftValue - rightValue)
}

// getRandomHintPool - shuffle hint pool for toast rotation
function getRandomHintPool(hints: StudentQuizSession['hints']) {
  return shuffleArray(hints)
}

// isTimerAlmostDone - detect critical timer state
function isTimerAlmostDone(secondsLeft: number, totalSeconds: number) {
  const safeTotalSeconds = totalSeconds <= 0 ? 1 : totalSeconds
  return secondsLeft / safeTotalSeconds <= 0.2
}

// getQuestionStatusClassName - style question type badge
function getQuestionStatusClassName(quizType: StudentQuizQuestion['quizType']) {
  if (quizType === 'identification') {
    return 'rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-blue-500'
  }

  return 'rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-blue-500'
}

// buildDraftPayload - normalize answer values for saving
function buildDraftPayload(values: StudentQuizFormInput | StudentQuizFormSchema) {
  return Object.entries(values.answers || {}).reduce<Record<string, string>>((result, [key, value]) => {
    result[key] = value || ''
    return result
  }, {})
}

// TakeQuizPageClient - render actual student quiz taking flow
export function TakeQuizPageClient({ session }: TakeQuizPageClientProps) {
  // ==================== SETUP ====================
  const router = useRouter()
  const isMobile = useIsMobile()
  const orderedQuestionsRef = useRef(getOrderedQuestions(session))
  const lastSavedAnswersRef = useRef(JSON.stringify(session.existingAnswers || {}))
  const availableHintCount = session.allowHint ? Math.min(session.hintCount, session.hints.length) : 0
  const hintMomentsRef = useRef(getRandomHintMoments(session.timeLimitMinutes * 60, availableHintCount))
  const hintPoolRef = useRef(getRandomHintPool(session.hints).slice(0, availableHintCount))
  const shownHintMomentsRef = useRef(new Set<number>())
  const timerContainerRef = useRef<HTMLDivElement | null>(null)
  const showTimerButtonRef = useRef<HTMLButtonElement | null>(null)
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
  const [timesUpDialogOpen, setTimesUpDialogOpen] = useState(false)
  const [warningDialogOpen, setWarningDialogOpen] = useState(false)
  const [isTimerDragging, setIsTimerDragging] = useState(false)
  const [isTimerVisible, setIsTimerVisible] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'slideshow'>('list')
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0)
  const [timerPosition, setTimerPosition] = useState({ x: 0, y: 0 })
  const [timeoutResultId, setTimeoutResultId] = useState<number | null>(null)
  const form = useForm<StudentQuizFormInput, unknown, StudentQuizFormSchema>({
    resolver: zodResolver(studentQuizFormSchema),
    defaultValues: {
      answers: session.existingAnswers || {},
    },
  })
  const watchedAnswers = form.watch('answers')
  const totalSeconds = session.timeLimitMinutes * 60
  const remainingAttempts = Math.max(session.cheatingAttempts - warningAttempts, 0)
  const totalQuestions = orderedQuestionsRef.current.length
  const activeQuestion = orderedQuestionsRef.current[activeQuestionIndex] || null
  const isLastSlideshowQuestion = activeQuestionIndex === totalQuestions - 1
  const shouldShakeTimer = isTimerAlmostDone(secondsLeft, totalSeconds)
  const unansweredCount = orderedQuestionsRef.current.filter((question) => {
    const answerValue = (watchedAnswers || {})[String(question.id)]
    return !answerValue?.trim()
  }).length
  const timerTopOffset = isMobile ? MOBILE_TIMER_TOP_OFFSET : TIMER_TOP_OFFSET
  const timerRightOffset = isMobile ? MOBILE_TIMER_RIGHT_OFFSET : TIMER_RIGHT_OFFSET
  const timerViewportPadding = isMobile ? MOBILE_TIMER_VIEWPORT_PADDING : TIMER_VIEWPORT_PADDING

  // ==================== SHOW RANDOM HINT ====================
  const showRandomHint = useCallback(() => {
    if (!session.allowHint || availableHintCount <= 0 || hintPoolRef.current.length === 0) {
      return
    }

    const nextHint = hintPoolRef.current.shift()

    if (!nextHint) {
      return
    }

    toast.success(`Hint: ${nextHint.answer}`, {
      description: nextHint.question,
      duration: QUIZ_HINT_MIN_DURATION,
    })
  }, [availableHintCount, session.allowHint])

  // ==================== CLAMP TIMER POSITION ====================
  const clampTimerPosition = useCallback(
    (nextPosition: { x: number; y: number }, options?: { hidden?: boolean }) => {
      if (typeof window === 'undefined') {
        return nextPosition
      }

      const targetElement = options?.hidden ? showTimerButtonRef.current : timerContainerRef.current

      if (!targetElement) {
        return nextPosition
      }

      const { width, height } = targetElement.getBoundingClientRect()
      const baseLeft = window.innerWidth - timerRightOffset - width
      const minX = timerViewportPadding - baseLeft
      const maxX = timerRightOffset - timerViewportPadding
      const minY = timerViewportPadding - timerTopOffset
      const maxY = window.innerHeight - height - timerViewportPadding - timerTopOffset

      return {
        x: Math.min(Math.max(nextPosition.x, minX), maxX),
        y: Math.min(Math.max(nextPosition.y, minY), Math.max(minY, maxY)),
      }
    },
    [timerRightOffset, timerTopOffset, timerViewportPadding]
  )

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
  const handleSubmitQuiz = async (options?: { showTimesUpDialog?: boolean }) => {
    try {
      setIsSubmitting(true)
      const payload = await persistAttempt('submit', warningAttempts)
      const scoreId = payload.scoreId || payload.id

      if (!scoreId) {
        throw new Error('Submitted assessment did not return a result id.')
      }

      toast.success('Assessment submitted successfully.')
      if (options?.showTimesUpDialog) {
        setTimeoutResultId(scoreId)
        setTimesUpDialogOpen(true)
        return
      }

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
    await handleSubmitQuiz({ showTimesUpDialog: secondsLeft === 0 })
  }

  // ==================== HANDLE TIMES UP CONTINUE ====================
  const handleTimesUpContinue = () => {
    if (!timeoutResultId) {
      return
    }

    setTimesUpDialogOpen(false)
    router.push(`/student/assessment/take-quiz/result?scoreId=${timeoutResultId}`)
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

  // ==================== QUIZ HINT EFFECT ====================
  useEffect(() => {
    if (!session.allowHint || availableHintCount <= 0 || isSubmitting || timesUpDialogOpen) {
      return
    }

    const elapsedSeconds = totalSeconds - secondsLeft
    const nextHintMoment = hintMomentsRef.current.find(
      (moment) => moment <= elapsedSeconds && !shownHintMomentsRef.current.has(moment)
    )

    if (nextHintMoment === undefined) {
      return
    }

    shownHintMomentsRef.current.add(nextHintMoment)
    showRandomHint()
  }, [
    isSubmitting,
    availableHintCount,
    secondsLeft,
    session.allowHint,
    showRandomHint,
    timesUpDialogOpen,
    totalSeconds,
  ])

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

    document.body.style.userSelect = 'none'

    const handlePointerMove = (event: PointerEvent) => {
      const nextX =
        timerDragStateRef.current.startOffsetX + (event.clientX - timerDragStateRef.current.startPointerX)
      const nextY =
        timerDragStateRef.current.startOffsetY + (event.clientY - timerDragStateRef.current.startPointerY)

      setTimerPosition(clampTimerPosition({ x: nextX, y: nextY }, { hidden: !isTimerVisible }))
    }

    const handlePointerUp = () => {
      setIsTimerDragging(false)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      document.body.style.userSelect = ''
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [clampTimerPosition, isTimerDragging, isTimerVisible])

  // ==================== TIMER POSITION EFFECT ====================
  useEffect(() => {
    const syncTimerPosition = () => {
      setTimerPosition((currentValue) =>
        clampTimerPosition(currentValue, { hidden: !isTimerVisible })
      )
    }

    const timeoutId = window.setTimeout(syncTimerPosition, 0)
    window.addEventListener('resize', syncTimerPosition)

    return () => {
      window.clearTimeout(timeoutId)
      window.removeEventListener('resize', syncTimerPosition)
    }
  }, [clampTimerPosition, isTimerVisible])

  // ==================== HANDLE TIMER DRAG ====================
  const handleTimerPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    event.preventDefault()
    event.stopPropagation()
    timerDragStateRef.current = {
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      startOffsetX: timerPosition.x,
      startOffsetY: timerPosition.y,
    }
    setIsTimerDragging(true)
  }

  // ==================== HANDLE VIEW MODE ====================
  const handleViewModeChange = (mode: 'list' | 'slideshow') => {
    setViewMode(mode)
    setActiveQuestionIndex(0)
  }

  // ==================== HANDLE QUESTION NAVIGATION ====================
  const handlePreviousQuestion = () => {
    setActiveQuestionIndex((currentValue) => Math.max(currentValue - 1, 0))
  }

  // ==================== HANDLE NEXT QUESTION ====================
  const handleNextQuestion = () => {
    setActiveQuestionIndex((currentValue) =>
      Math.min(currentValue + 1, totalQuestions - 1)
    )
  }

  // ==================== RENDER QUESTION CARD ====================
  const renderQuestionCard = (question: StudentQuizQuestion, index: number) => (
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
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border px-2 py-1.5 transition-colors ${
                          field.value === choice.value
                            ? 'border-primary/30 bg-primary/10'
                            : 'border-border bg-muted/40 hover:bg-muted/60'
                        }`}
                      >
                        <RadioGroupItem value={choice.value} className="sr-only" />
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-sm font-semibold transition-colors ${
                            field.value === choice.value
                              ? 'border-primary/30 bg-primary text-primary-foreground'
                              : 'border-border bg-card text-foreground'
                          }`}
                        >
                          {choice.key}
                        </div>
                        <div className="flex min-h-9 flex-1 items-center pr-1">
                          <div
                            className={`text-sm leading-4 ${
                              field.value === choice.value ? 'text-foreground' : 'text-muted-foreground'
                            }`}
                          >
                            {choice.value}
                          </div>
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
  )

  return (
    <>
      <div className="mx-auto flex w-full max-w-none flex-col gap-6 px-4 py-6 lg:px-8 xl:px-10">
        <Card>
          <CardHeader className="border-b">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <CardTitle>{session.subjectName}</CardTitle>
                <CardDescription>
                  {session.sectionName} - {session.moduleCode} - {session.termName}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => void handleDraftSave(warningAttempts)}
                  disabled={isSavingDraft || isSubmitting}
                >
                  {isSavingDraft ? (
                    <>
                      <Loader2 size={18} className="mr-0 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Progress'
                  )}
                </Button>
                <Tabs
                  value={viewMode}
                  onValueChange={(value) => handleViewModeChange(value as 'list' | 'slideshow')}
                  className="w-auto"
                >
                  <TabsList>
                    <TabsTrigger value="list" className="cursor-pointer">
                      List
                    </TabsTrigger>
                    <TabsTrigger value="slideshow" className="cursor-pointer">
                      Slideshow
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-0">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-medium">{session.educatorName}</div>
                  <Badge variant="outline">{session.educatorUserType}</Badge>
                </div>
              </div>
              <div className="space-y-1 md:text-right">
                <div className="text-muted-foreground text-xs uppercase">
                  Schedule
                </div>
                <div className="text-sm">
                  {session.startDate} {session.startTime} - {session.endDate} {session.endTime}
                </div>
              </div>
            </div>
            <div className="text-muted-foreground text-sm">
              Answer each question carefully. Your answers are saved while you work.
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form className="space-y-6">
            {viewMode === 'list' ? (
              orderedQuestionsRef.current.map((question, index) => renderQuestionCard(question, index))
            ) : activeQuestion ? (
              <div className="space-y-4">
                {renderQuestionCard(activeQuestion, activeQuestionIndex)}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-muted-foreground text-sm">
                    Question {activeQuestionIndex + 1} of {totalQuestions}
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="cursor-pointer"
                      disabled={activeQuestionIndex === 0}
                      onClick={handlePreviousQuestion}
                    >
                      Previous
                    </Button>
                    {isLastSlideshowQuestion ? (
                      <Button
                        type="button"
                        className="cursor-pointer"
                        disabled={isSubmitting}
                        onClick={() => setSubmitDialogOpen(true)}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 size={18} className="mr-0 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Submit'
                        )}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="cursor-pointer"
                        onClick={handleNextQuestion}
                      >
                        Next
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              {viewMode === 'list' ? (
                <Button
                  type="button"
                  className="cursor-pointer"
                  onClick={() => setSubmitDialogOpen(true)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="mr-0 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Submit'
                  )}
                </Button>
              ) : null}
            </div>
          </form>
        </Form>
      </div>

      {isTimerVisible ? (
        <div
          ref={timerContainerRef}
          className={`fixed z-40 select-none ${isMobile ? 'top-[84px] right-3 w-[220px]' : 'top-24 right-6 w-[280px]'} ${isTimerDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{
            transform: `translate(${timerPosition.x}px, ${timerPosition.y}px)`,
            touchAction: 'none',
          }}
          onPointerDown={handleTimerPointerDown}
        >
          <div className={`rounded-xl border bg-card shadow-lg ${isMobile ? 'p-3' : 'p-4'} ${shouldShakeTimer ? 'animate-[timer-shake_0.6s_ease-in-out_infinite]' : ''}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold">Time Remaining</div>
                {!isMobile ? (
                  <div className="text-muted-foreground text-xs">Drag this timer anywhere while you answer</div>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`cursor-pointer ${isMobile ? 'h-8 w-8' : ''}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    setIsTimerVisible(false)
                  }}
                >
                  <IconEyeOff size={18} />
                  <span className="sr-only">Hide timer</span>
                </Button>
                <IconClock size={isMobile ? 18 : 20} className="text-muted-foreground" />
              </div>
            </div>
            <div className={`flex items-center justify-between ${isMobile ? 'mt-3' : 'mt-4'}`}>
              <Badge className={getTimerBadgeClassName(secondsLeft, totalSeconds)}>
                {formatRemainingTime(secondsLeft)}
              </Badge>
              <span className="text-muted-foreground text-xs">
                {isMobile
                  ? `Warnings: ${remainingAttempts}`
                  : `Warning left: ${Math.max(session.cheatingAttempts - warningAttempts, 0)}`}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <Button
          ref={showTimerButtonRef}
          type="button"
          variant="outline"
          className={`fixed z-40 cursor-grab border !bg-card shadow-lg select-none hover:!bg-card ${isMobile ? 'top-[84px] right-3 h-10 rounded-full px-3 text-xs' : 'top-24 right-6 rounded-full'} ${isTimerDragging ? 'cursor-grabbing' : ''}`}
          style={{
            transform: `translate(${timerPosition.x}px, ${timerPosition.y}px)`,
            touchAction: 'none',
          }}
          onPointerDown={handleTimerPointerDown}
          onClick={() => setIsTimerVisible(true)}
        >
          <IconEye size={18} className={isMobile ? '' : 'mr-0'} />
          {isMobile ? (
            <span className="ml-2">{formatRemainingTime(secondsLeft)}</span>
          ) : (
            'Show Timer'
          )}
        </Button>
      )}

      <CheatingWarningDialog
        open={warningDialogOpen}
        remainingAttempts={remainingAttempts}
        onContinue={() => setWarningDialogOpen(false)}
      />

      <SubmitQuizDialog
        open={submitDialogOpen}
        isSubmitting={isSubmitting}
        unansweredCount={unansweredCount}
        onOpenChange={setSubmitDialogOpen}
        onSubmit={() => void handleSubmitQuiz()}
      />

      <TimesUpDialog
        open={timesUpDialogOpen}
        onContinue={handleTimesUpContinue}
      />
    </>
  )
}
