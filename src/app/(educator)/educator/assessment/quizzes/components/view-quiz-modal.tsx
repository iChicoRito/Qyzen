'use client'

import { useState } from 'react'
import { IconEye } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import type { Quiz } from '../data/schema'

interface ViewQuizModalProps {
  quiz: Quiz
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

// ViewQuizModal - view quiz details
export function ViewQuizModal({
  quiz,
  trigger,
  open,
  onOpenChange,
}: ViewQuizModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const dialogOpen = open ?? internalOpen
  const setDialogOpen = onOpenChange ?? setInternalOpen

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : open === undefined ? (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="cursor-pointer">
            <IconEye size={18} />
            View Quiz
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[560px]">
        <DialogHeader className="px-6 pt-6 pb-4 text-left">
          <DialogTitle>{quiz.moduleCode}</DialogTitle>
          <DialogDescription>Quiz information and answer details.</DialogDescription>
        </DialogHeader>

        <div className="max-h-[50vh] space-y-6 overflow-y-auto border-t border-b px-6 py-4">
          <div className="space-y-2">
            <p className="font-semibold">Module</p>
            <p className="text-muted-foreground">
              {quiz.moduleCode} | {quiz.moduleId}
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-semibold">Class</p>
            <p className="text-muted-foreground">
              {quiz.subjectName} | {quiz.sectionName} | {quiz.termName}
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-semibold">Question</p>
            <p className="text-muted-foreground">{quiz.question}</p>
          </div>

          {quiz.quizType === 'multiple_choice' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-muted-foreground">Choices</p>
                <Badge variant="outline" className="shrink-0">
                  Multiple Choice
                </Badge>
              </div>

              <div className="space-y-3">
                {quiz.choices.map((choice) => {
                  const isCorrect = choice.value === quiz.correctAnswer

                  return (
                    <div
                      key={choice.key}
                      className={
                        isCorrect
                          ? 'rounded-xl border border-green-500 bg-green-500/10 px-4 py-2'
                          : 'rounded-xl border bg-card px-4 py-2'
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={isCorrect ? 'font-semibold text-green-500' : 'font-semibold text-foreground'}>
                            Choice {choice.key}
                          </p>
                          <p className="mt-1 text-muted-foreground">{choice.value}</p>
                        </div>

                        {isCorrect ? (
                          <span className="text-xs rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500">
                            Correct Answer
                          </span>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-muted-foreground">Accepted Answers</p>
                <Badge variant="outline" className="shrink-0">
                  Identification
                </Badge>
              </div>

              <div className="space-y-3">
                {quiz.correctAnswers.map((answer) => (
                  <div
                    key={answer}
                    className="rounded-xl border border-green-500 bg-green-500/10 px-4 py-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-green-500">Accepted Answer</p>
                        <p className="mt-1 text-muted-foreground">{answer}</p>
                      </div>

                      <span className="text-xs rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500">
                        Correct Answer
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="cursor-pointer">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
