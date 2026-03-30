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

// getQuizTypeClassName - build badge color by quiz type
function getQuizTypeClassName(quizType: 'multiple_choice' | 'identification') {
  if (quizType === 'multiple_choice') {
    return 'rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-blue-500'
  }

  return 'rounded-md border-0 bg-yellow-500/10 px-2.5 py-0.5 text-yellow-500'
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
      <DialogContent
        showCloseButton={false}
        className="overflow-hidden border-0 bg-background p-0 shadow-none sm:max-w-[560px]"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{quiz.moduleCode}</DialogTitle>
          <DialogDescription>Quiz information and answer details.</DialogDescription>
        </DialogHeader>

        <div className="overflow-hidden rounded-[28px] bg-background">
          <div className="px-6 pb-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b py-6">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold tracking-tight">{quiz.moduleCode}</h2>
                <p className="text-sm text-muted-foreground">
                  Quiz information and answer details.
                </p>
              </div>
              <Badge variant="outline" className={`${getQuizTypeClassName(quiz.quizType)} mt-1 shrink-0`}>
                {quiz.quizType === 'multiple_choice' ? 'Multiple Choice' : 'Identification'}
              </Badge>
            </div>

            <div className="max-h-[40vh] space-y-6 overflow-y-auto py-6">
              <div className="space-y-2">
                <p className="font-semibold">Module</p>
                <p className="text-muted-foreground">{quiz.moduleCode}</p>
              </div>

              <div className="space-y-2">
                <p className="font-semibold">Subject and Section</p>
                <p className="text-muted-foreground">
                  {quiz.subjectName} | {quiz.sectionName}
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-semibold">Academic Term</p>
                <p className="text-muted-foreground">{quiz.termName}</p>
              </div>

              <div className="space-y-2">
                <p className="font-semibold">Question</p>
                <p className="text-muted-foreground">{quiz.question}</p>
              </div>

              {quiz.quizType === 'multiple_choice' ? (
                <div className="space-y-2">
                  <p className="font-semibold">Choices</p>
                  <div className="space-y-2">
                    {quiz.choices.map((choice) => (
                      <div key={choice.key} className="rounded-md border px-4 py-3">
                        <p className="font-medium">Choice {choice.key}</p>
                        <p className="text-sm text-muted-foreground">{choice.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <p className="font-semibold">Correct Answer</p>
                <p className="text-muted-foreground">{quiz.correctAnswers.join(', ')}</p>
              </div>
            </div>

            <DialogClose asChild>
              <Button variant="outline" className="h-10 w-full cursor-pointer rounded-xl">
                Close
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
