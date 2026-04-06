'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import { IconEye } from '@tabler/icons-react'

import { ResultSummaryChart } from '@/app/(student)/student/assessment/take-quiz/result/components/result-summary-chart'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from '@/components/ui/responsive-dialog'
import { Separator } from '@/components/ui/separator'

import type { EducatorScore } from '../data/schema'

interface ViewScoresModalProps {
  score: EducatorScore
  trigger?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

// getStatusClassName - build score status badge classes
function getStatusClassName(status: 'passed' | 'failed') {
  if (status === 'passed') {
    return 'rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500'
  }

  return 'rounded-md border-0 bg-rose-500/10 px-2.5 py-0.5 text-rose-500'
}

// getAttemptBadgeClassName - style attempt history badge classes
function getAttemptBadgeClassName(isBestScore: boolean) {
  if (isBestScore) {
    return 'rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-blue-500'
  }

  return 'rounded-md border-0 bg-yellow-500/10 px-2.5 py-0.5 text-yellow-500'
}

// getReviewChoiceClassName - style reviewed answer rows
function getReviewChoiceClassName(
  shouldRevealCorrectAnswer: boolean,
  isWrongStudentChoice: boolean,
  isCorrectStudentChoice: boolean
) {
  if (isCorrectStudentChoice) {
    return 'border-primary/30 bg-primary/10'
  }

  if (shouldRevealCorrectAnswer) {
    return 'border-green-500/30 bg-green-500/10'
  }

  if (isWrongStudentChoice) {
    return 'border-rose-500/30 bg-rose-500/10'
  }

  return 'border-border bg-muted/40'
}

// getReviewChoiceChipClassName - style reviewed answer chips
function getReviewChoiceChipClassName(
  shouldRevealCorrectAnswer: boolean,
  isWrongStudentChoice: boolean,
  isCorrectStudentChoice: boolean
) {
  if (isCorrectStudentChoice) {
    return 'border-primary/30 bg-primary text-primary-foreground'
  }

  if (shouldRevealCorrectAnswer) {
    return 'border-green-500/30 bg-green-500 text-white'
  }

  if (isWrongStudentChoice) {
    return 'border-rose-500/30 bg-rose-500 text-white'
  }

  return 'border-border bg-card text-foreground'
}

// getReviewChoiceTextClassName - style reviewed answer text
function getReviewChoiceTextClassName(
  shouldRevealCorrectAnswer: boolean,
  isWrongStudentChoice: boolean,
  isCorrectStudentChoice: boolean
) {
  if (isCorrectStudentChoice) {
    return 'text-foreground'
  }

  if (shouldRevealCorrectAnswer) {
    return 'text-green-500'
  }

  if (isWrongStudentChoice) {
    return 'text-rose-500'
  }

  return 'text-muted-foreground'
}

// getStudentAnswerLabel - format displayed student answer
function getStudentAnswerLabel(score: EducatorScore, question: EducatorScore['questions'][number]) {
  if (question.quizType === 'multiple_choice') {
    const selectedChoice = question.choices.find((choice) => choice.value === question.studentAnswer)

    if (!selectedChoice) {
      return question.studentAnswer || 'No answer submitted'
    }

    return `${selectedChoice.key}. ${selectedChoice.value}`
  }

  if (!score.allowReview && !question.isCorrect) {
    return question.studentAnswer || 'No answer submitted'
  }

  return question.studentAnswer || 'No answer submitted'
}

// ViewScoresModal - review a student assessment attempt
export function ViewScoresModal({
  score,
  trigger,
  open,
  onOpenChange,
}: ViewScoresModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const dialogOpen = open ?? internalOpen
  const setDialogOpen = onOpenChange ?? setInternalOpen
  const correctAnswers = score.questions.filter((question) => question.isCorrect).length
  const incorrectAnswers = score.questions.length - correctAnswers

  return (
    <ResponsiveDialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger ? (
        <ResponsiveDialogTrigger asChild>{trigger}</ResponsiveDialogTrigger>
      ) : open === undefined ? (
        <ResponsiveDialogTrigger asChild>
          <Button variant="outline" size="sm" className="cursor-pointer">
            <IconEye size={18} />
            View Score
          </Button>
        </ResponsiveDialogTrigger>
      ) : null}
      <ResponsiveDialogContent className="gap-0 p-0" desktopClassName="sm:max-w-[1080px]">
        <ResponsiveDialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <ResponsiveDialogTitle>{score.moduleCode}</ResponsiveDialogTitle>
            <Badge className={getStatusClassName(score.status)}>{score.status}</Badge>
          </div>
          <ResponsiveDialogDescription>
            {score.studentName} ({score.studentUserId}) - {score.subjectName} - {score.sectionName} - {score.termName}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="max-h-[68vh] space-y-6 border-t border-b">
          <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="rounded-lg border p-4">
              <ResultSummaryChart
                correctAnswers={correctAnswers}
                incorrectAnswers={incorrectAnswers}
                percentage={score.percentage}
              />
            </div>
            <div className="space-y-5">
              <div className="space-y-1">
                <div className="text-lg font-semibold">Assessment Summary</div>
                <div className="text-muted-foreground text-sm">
                  Review the highest score summary, latest attempt, retake allowance, and answered questions.
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge className={getStatusClassName(score.status)}>{score.status}</Badge>
                <div className="text-sm font-medium">{score.studentName}</div>
              </div>

              <Separator />

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.18em]">
                    Highest Score
                  </div>
                  <div className="text-3xl font-semibold tracking-tight">
                    {score.score} / {score.totalQuestions}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.18em]">
                    Highest Percentage
                  </div>
                  <div className="text-3xl font-semibold tracking-tight">{score.percentage}%</div>
                </div>
              </div>

              <Separator />

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.18em]">
                    Latest Attempt
                  </div>
                  <div className="text-sm font-medium">
                    {score.latestScore} / {score.latestTotalQuestions}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.18em]">
                    Latest Percentage
                  </div>
                  <div className="text-sm font-medium">{score.latestPercentage}%</div>
                </div>
              </div>

              <Separator />

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.18em]">
                    Highest Attempt ID
                  </div>
                  <div className="text-sm font-medium">{score.bestScoreId ?? 'N/A'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.18em]">
                    Retakes Remaining
                  </div>
                  <div className="text-sm font-medium">{score.remainingRetakes}</div>
                </div>
              </div>

              <Separator />

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.18em]">
                    Highest Submitted At
                  </div>
                  <div className="text-sm font-medium">{score.submittedAt || 'Not submitted'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.18em]">
                    Latest Submitted At
                  </div>
                  <div className="text-sm font-medium">{score.latestSubmittedAt || 'Not submitted'}</div>
                </div>
              </div>

              <Separator />

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.18em]">
                    Academic Term
                  </div>
                  <div className="text-sm font-medium">{score.termName}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.18em]">
                    Time Limit
                  </div>
                  <div className="text-sm font-medium">{score.timeLimitMinutes} minutes</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.18em]">
                    Schedule
                  </div>
                  <div className="text-sm font-medium">
                    {score.startDate} {score.startTime} - {score.endDate} {score.endTime}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.18em]">
                    Attempts Used
                  </div>
                  <div className="text-sm font-medium">{score.submittedAttemptCount}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.18em]">
                    Granted Extra Retakes
                  </div>
                  <div className="text-sm font-medium">{score.grantedRetakeCount}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-lg font-semibold">Attempt History</div>
            {score.attemptHistory.map((attempt) => (
              <div key={attempt.scoreId} className="rounded-lg border px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium">Attempt #{attempt.attemptNumber}</div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={getAttemptBadgeClassName(attempt.isBestScore)}>
                      {attempt.isBestScore ? 'Highest Score' : 'Attempt'}
                    </Badge>
                    <Badge className={getStatusClassName(attempt.status)}>{attempt.status}</Badge>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <div className="text-muted-foreground text-xs">Score</div>
                    <div className="mt-1 font-medium">
                      {attempt.score} / {attempt.totalQuestions}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Percentage</div>
                    <div className="mt-1 font-medium">{attempt.percentage}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Submitted</div>
                    <div className="mt-1 font-medium">{attempt.submittedAt || 'Not submitted'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {score.questions.map((question, index) => (
              <div key={question.id} className="rounded-lg border">
                <div className="border-b px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-semibold">Question #{index + 1}</div>
                    <Badge
                      className={
                        question.isCorrect
                          ? 'rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500'
                          : 'rounded-md border-0 bg-rose-500/10 px-2.5 py-0.5 text-rose-500'
                      }
                    >
                      {question.isCorrect ? 'Correct' : 'Incorrect'}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground mt-2 text-sm">{question.question}</div>
                </div>

                <div className="space-y-2 px-4 py-4">
                  {question.quizType === 'multiple_choice' ? (
                    <>
                      {question.choices.map((choice) => {
                        const isSelectedChoice = question.studentAnswer === choice.value
                        const isWrongStudentChoice = isSelectedChoice && !question.isCorrect
                        const isCorrectStudentChoice = isSelectedChoice && question.isCorrect
                        const shouldRevealCorrectAnswer =
                          question.correctAnswers.includes(choice.value) &&
                          (score.allowReview || question.isCorrect)

                        return (
                          <div
                            key={`${question.id}-${choice.key}`}
                            className={`flex items-center gap-2 rounded-xl border px-2 py-1.5 ${getReviewChoiceClassName(
                              shouldRevealCorrectAnswer,
                              isWrongStudentChoice,
                              isCorrectStudentChoice
                            )}`}
                          >
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-sm font-semibold ${getReviewChoiceChipClassName(
                                shouldRevealCorrectAnswer,
                                isWrongStudentChoice,
                                isCorrectStudentChoice
                              )}`}
                            >
                              {choice.key}
                            </div>
                            <div className="flex min-h-9 flex-1 items-center pr-1">
                              <div
                                className={`text-sm leading-4 ${getReviewChoiceTextClassName(
                                  shouldRevealCorrectAnswer,
                                  isWrongStudentChoice,
                                  isCorrectStudentChoice
                                )}`}
                              >
                                {choice.value}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </>
                  ) : score.allowReview || question.isCorrect ? (
                    <div className="rounded-lg border-0 bg-green-500/10 px-4 py-2.5 text-sm text-green-500">
                      Correct Answer: {question.correctAnswers.join(', ')}
                    </div>
                  ) : null}

                  <div
                    className={`rounded-lg border-0 px-4 py-2.5 text-sm ${
                      question.isCorrect ? 'bg-primary/10 text-primary' : 'bg-rose-500/10 text-rose-500'
                    }`}
                  >
                    Student Answer: {getStudentAnswerLabel(score, question)}{' '}
                    <span className="font-medium">{question.isCorrect ? 'Correct' : 'Incorrect'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter className="sm:justify-start">
          <ResponsiveDialogClose asChild>
            <Button type="button" variant="outline" className="cursor-pointer">
              Close
            </Button>
          </ResponsiveDialogClose>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
