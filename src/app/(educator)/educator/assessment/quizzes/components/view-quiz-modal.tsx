'use client'

import { useState } from 'react'
import { IconEye } from '@tabler/icons-react'

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

import type { QuizGroup } from '../data/schema'

interface ViewQuizModalProps {
  quizGroup: QuizGroup
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

// getQuizTypeClassName - style question type badge
function getQuizTypeClassName(quizType: 'multiple_choice' | 'identification') {
  if (quizType === 'multiple_choice') {
    return 'rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-blue-500'
  }

  return 'rounded-md border-0 bg-yellow-500/10 px-2.5 py-0.5 text-yellow-500'
}

// ViewQuizModal - view grouped module quiz details
export function ViewQuizModal({
  quizGroup,
  trigger,
  open,
  onOpenChange,
}: ViewQuizModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const dialogOpen = open ?? internalOpen
  const setDialogOpen = onOpenChange ?? setInternalOpen

  return (
    <ResponsiveDialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger ? (
        <ResponsiveDialogTrigger asChild>{trigger}</ResponsiveDialogTrigger>
      ) : open === undefined ? (
        <ResponsiveDialogTrigger asChild>
          <Button variant="outline" size="sm" className="cursor-pointer">
            <IconEye size={18} />
            View Questions
          </Button>
        </ResponsiveDialogTrigger>
      ) : null}
      <ResponsiveDialogContent className="gap-0 p-0" desktopClassName="sm:max-w-[760px]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{quizGroup.moduleCode}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>All quiz questions stored under this module.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="max-h-[68vh] space-y-6 border-t border-b">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="font-semibold">Module Code</p>
              <p className="text-muted-foreground">{quizGroup.moduleCode}</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold">Class</p>
              <p className="text-muted-foreground">
                {quizGroup.subjectName} | {quizGroup.sectionName} | {quizGroup.termName}
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold">Total Questions</p>
              <p className="text-muted-foreground">{quizGroup.totalQuestions}</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold">Question Types</p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{quizGroup.quizTypeLabel}</Badge>
                <Badge variant="outline">MC: {quizGroup.multipleChoiceCount}</Badge>
                <Badge variant="outline">ID: {quizGroup.identificationCount}</Badge>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {quizGroup.questions.map((quiz, index) => (
              <div key={quiz.id} className="rounded-xl border">
                <div className="border-b px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-semibold">Question #{index + 1}</div>
                    <Badge className={getQuizTypeClassName(quiz.quizType)}>
                      {quiz.quizType === 'multiple_choice' ? 'Multiple Choice' : 'Identification'}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground mt-2 text-sm">{quiz.question}</div>
                </div>

                <div className="space-y-3 px-4 py-4">
                  {quiz.quizType === 'multiple_choice' ? (
                    quiz.choices.map((choice) => {
                      const isCorrect = choice.value === quiz.correctAnswer

                      return (
                        <div
                          key={`${quiz.id}-${choice.key}`}
                          className={
                            isCorrect
                              ? 'rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3'
                              : 'rounded-xl border px-4 py-3'
                          }
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className={isCorrect ? 'font-semibold text-green-500' : 'font-semibold'}>
                                Choice {choice.key}
                              </p>
                              <p className="text-muted-foreground mt-1 text-sm">{choice.value}</p>
                            </div>
                            {isCorrect ? (
                              <Badge className="rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500">
                                Correct Answer
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="space-y-3">
                      {quiz.correctAnswers.map((answer) => (
                        <div
                          key={`${quiz.id}-${answer}`}
                          className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-green-500">Accepted Answer</p>
                              <p className="text-muted-foreground mt-1 text-sm">{answer}</p>
                            </div>
                            <Badge className="rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500">
                              Correct Answer
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {index < quizGroup.questions.length - 1 ? <Separator /> : null}
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
