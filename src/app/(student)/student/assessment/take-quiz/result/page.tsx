import Link from 'next/link'

import { requireServerAuthContext } from '@/lib/auth/server'
import {
  QUIZ_RESULT_PASSING_PERCENTAGE,
  fetchStudentQuizReviewResult,
  type StudentQuizReviewQuestion,
} from '@/lib/supabase/student-quiz'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import { ResultSummaryChart } from './components/result-summary-chart'

interface TakeQuizResultPageProps {
  searchParams: Promise<{
    scoreId?: string
  }>
}

// getStatusClassName - resolve status badge color
function getStatusClassName(status: 'passed' | 'failed') {
  if (status === 'passed') {
    return 'rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500 uppercase'
  }

  return 'rounded-md border-0 bg-rose-500/10 px-2.5 py-0.5 text-rose-500 uppercase'
}

// getChoiceClassName - style reviewed multiple choice answers
function getChoiceClassName(
  shouldRevealCorrectAnswer: boolean,
  isStudentChoice: boolean,
  isIncorrectChoice: boolean,
  isCorrectStudentChoice: boolean
) {
  if (isCorrectStudentChoice) {
    return 'border-primary/30 bg-primary/10'
  }

  if (shouldRevealCorrectAnswer) {
    return 'border-green-500/30 bg-green-500/10'
  }

  if (isStudentChoice && isIncorrectChoice) {
    return 'border-rose-500/30 bg-rose-500/10'
  }

  return 'border-border bg-muted/40'
}

// getChoiceChipClassName - style reviewed option key chip
function getChoiceChipClassName(
  shouldRevealCorrectAnswer: boolean,
  isStudentChoice: boolean,
  isIncorrectChoice: boolean,
  isCorrectStudentChoice: boolean
) {
  if (isCorrectStudentChoice) {
    return 'border-primary/30 bg-primary text-primary-foreground'
  }

  if (shouldRevealCorrectAnswer) {
    return 'border-green-500/30 bg-green-500 text-white'
  }

  if (isStudentChoice && isIncorrectChoice) {
    return 'border-rose-500/30 bg-rose-500 text-white'
  }

  return 'border-border bg-card text-foreground'
}

// getChoiceTextClassName - style reviewed option text
function getChoiceTextClassName(
  shouldRevealCorrectAnswer: boolean,
  isStudentChoice: boolean,
  isIncorrectChoice: boolean,
  isCorrectStudentChoice: boolean
) {
  if (isCorrectStudentChoice) {
    return 'text-foreground'
  }

  if (shouldRevealCorrectAnswer) {
    return 'text-green-500'
  }

  if (isStudentChoice && isIncorrectChoice) {
    return 'text-rose-500'
  }

  return 'text-muted-foreground'
}

// getChoiceLabel - build review choice text
function getChoiceLabel(key: string, value: string) {
  return `${key}. ${value}`
}

// getStudentAnswerLabel - format student answer text
function getStudentAnswerLabel(question: StudentQuizReviewQuestion) {
  if (question.quizType === 'multiple_choice') {
    const selectedChoice = question.choices.find((choice) => choice.value === question.studentAnswer)

    if (!selectedChoice) {
      return question.studentAnswer || 'No answer submitted'
    }

    return getChoiceLabel(selectedChoice.key, selectedChoice.value)
  }

  return question.studentAnswer || 'No answer submitted'
}

// TakeQuizResultPage - render dedicated result review page
export default async function TakeQuizResultPage({ searchParams }: TakeQuizResultPageProps) {
  // ==================== LOAD DATA ====================
  const params = await searchParams
  const rawScoreId = params.scoreId?.trim()
  const scoreId = rawScoreId ? Number(rawScoreId) : Number.NaN

  if (!Number.isFinite(scoreId)) {
    return (
      <div className="@container/main flex flex-1 flex-col px-4 py-6 md:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Result not found</CardTitle>
            <CardDescription>Open this page from a submitted assessment result.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const context = await requireServerAuthContext('student')
  const result = await fetchStudentQuizReviewResult(context.profile.id, scoreId)

  // ==================== EMPTY STATE ====================
  if (!result) {
    return (
      <div className="@container/main flex flex-1 flex-col px-4 py-6 md:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Result not found</CardTitle>
            <CardDescription>This assessment result is not available for your account.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // ==================== RENDER ====================
  return (
    <div className="@container/main flex flex-1 flex-col px-4 py-6 md:px-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {result.questions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader className="border-b pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>Question #{index + 1}</CardTitle>
                  <Badge className={question.isCorrect
                    ? 'rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500'
                    : 'rounded-md border-0 bg-rose-500/10 px-2.5 py-0.5 text-rose-500'}>
                    {question.isCorrect ? 'Correct' : 'Incorrect'}
                  </Badge>
                </div>
                <CardDescription>{question.question}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pt-2">
                {question.quizType === 'multiple_choice' ? (
                  <div className="space-y-2">
                    {question.choices.map((choice) => {
                      const isCorrect = question.correctAnswers.includes(choice.value)
                      const isSelectedChoice = question.studentAnswer === choice.value
                      const isStudentChoice = isSelectedChoice && !question.isCorrect
                      const isIncorrectChoice = Boolean(question.studentAnswer) && !question.isCorrect
                      const isCorrectStudentChoice = isSelectedChoice && question.isCorrect
                      const shouldRevealCorrectAnswer = isCorrect && (result.allowReview || question.isCorrect)

                      return (
                        <div
                          key={`${question.id}-${choice.key}`}
                          className={`flex items-center gap-2 rounded-xl border px-2 py-1.5 ${getChoiceClassName(
                            shouldRevealCorrectAnswer,
                            isStudentChoice,
                            isIncorrectChoice,
                            isCorrectStudentChoice
                          )}`}
                        >
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-sm font-semibold ${getChoiceChipClassName(
                              shouldRevealCorrectAnswer,
                              isStudentChoice,
                              isIncorrectChoice,
                              isCorrectStudentChoice
                            )}`}
                          >
                            {choice.key}
                          </div>
                          <div className="flex min-h-9 flex-1 items-center pr-1">
                            <div
                              className={`text-sm leading-4 ${getChoiceTextClassName(
                                shouldRevealCorrectAnswer,
                                isStudentChoice,
                                isIncorrectChoice,
                                isCorrectStudentChoice
                              )}`}
                            >
                              {choice.value}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {result.allowReview || question.isCorrect ? (
                      <div className="rounded-lg border-0 bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
                        Correct Answer: {question.correctAnswers.join(', ')}
                      </div>
                    ) : null}
                  </div>
                )}

                {question.quizType === 'identification' && !question.isCorrect ? (
                  <div className="rounded-lg border-0 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-500">
                    Your Answer: {getStudentAnswerLabel(question)} <span className="font-medium">Incorrect</span>
                  </div>
                ) : null}

                {question.quizType === 'identification' && question.isCorrect ? (
                  <div className="rounded-lg border-0 bg-primary/10 px-4 py-2.5 text-sm text-primary">
                    Your Answer: {getStudentAnswerLabel(question)} <span className="font-medium">Correct</span>
                  </div>
                ) : null}

                {!question.isCorrect ? (
                  <div className="rounded-lg border-0 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-500">
                    Your Answer: {getStudentAnswerLabel(question)} <span className="font-medium">Incorrect</span>
                  </div>
                ) : null}

                {question.isCorrect && question.quizType === 'multiple_choice' ? (
                  <div className="rounded-lg border-0 bg-primary/10 px-4 py-2.5 text-sm text-primary">
                    Your Answer: {getStudentAnswerLabel(question)} <span className="font-medium">Correct</span>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>{result.subjectName}</CardTitle>
              <CardDescription>
                {result.sectionName} - {result.moduleCode} - {result.termName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <ResultSummaryChart
                correctAnswers={result.score}
                incorrectAnswers={Math.max(result.totalQuestions - result.score, 0)}
                percentage={result.percentage}
              />

              <Separator />

              <div className="space-y-8">
                <div>
                  <div className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.18em]">INSTRUCTOR</div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="text-sm font-medium">{result.educatorName}</div>
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.18em]">Passing Requirement</div>
                  <div className="mt-2 text-2xl font-semibold tracking-tight">
                    {QUIZ_RESULT_PASSING_PERCENTAGE}%
                  </div>
                </div>
              </div>

              <div>
                <div className="space-y-1">
                  <div className="text-foreground text-lg font-semibold">Score Snapshot</div>
                  <div className="text-muted-foreground text-sm">
                    Your final score and percentage for this assessment.
                  </div>
                </div>
                <div className="mt-5 space-y-5">
                  <div>
                    <div className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.18em]">Score</div>
                    <div className="mt-3 text-3xl font-semibold tracking-tight">
                      {result.score} / {result.totalQuestions}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <div className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.18em]">Percentage</div>
                    <div className="mt-3 text-3xl font-semibold tracking-tight">{result.percentage}%</div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-sm font-semibold">Assessment Details</div>
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="text-muted-foreground text-xs">Submitted At</div>
                    <div className="mt-1 text-sm font-medium">{result.submittedAt || 'Not submitted'}</div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-muted-foreground text-xs">Time Limit</div>
                      <div className="mt-1 text-sm font-medium">{result.timeLimitMinutes} minutes</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Shuffle</div>
                      <div className="mt-1 text-sm font-medium">{result.isShuffle ? 'Enabled' : 'Disabled'}</div>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-muted-foreground text-xs">Warnings Used</div>
                      <div className="mt-1 text-sm font-medium">{result.warningAttempts}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Status</div>
                      <div className="mt-2">
                        <Badge className={getStatusClassName(result.status)}>{result.status}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-sm font-semibold">Schedule</div>
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-muted-foreground text-xs">Start</div>
                      <div className="mt-1 text-sm font-medium">
                        {result.startDate} {result.startTime}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">End</div>
                      <div className="mt-1 text-sm font-medium">
                        {result.endDate} {result.endTime}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-sm font-semibold">Result Summary</div>
                <div className="text-muted-foreground mt-2 text-sm">
                  {result.isPassed
                    ? 'You passed this assessment. Review the questions on the left to confirm the correct answers.'
                    : 'You did not reach the passing score yet. Review the questions on the left and focus on the incorrect answers.'}
                </div>
              </div>

              <Button asChild className="w-full cursor-pointer">
                <Link href="/student/assessment/quiz">Back to Assessments</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
