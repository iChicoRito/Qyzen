'use client'

import { useState } from 'react'
import type { Row } from '@tanstack/react-table'
import { IconDotsVertical } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import type { Quiz } from '../data/schema'
import { quizSchema } from '../data/schema'
import { DeleteConfirmationModal } from './delete-confirmation-modal'
import { EditQuizModal } from './edit-quiz-modal'
import { ViewQuizModal } from './view-quiz-modal'

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  onDeleteQuiz?: (quizId: number) => Promise<void> | void
  onUpdateQuiz?: (quiz: Quiz) => Promise<void> | void
}

// DataTableRowActions - render quiz row actions
export function DataTableRowActions<TData>({
  row,
  onDeleteQuiz,
  onUpdateQuiz,
}: DataTableRowActionsProps<TData>) {
  const quiz = quizSchema.parse(row.original)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 cursor-pointer p-0 data-[state=open]:bg-muted"
          >
            <IconDotsVertical size={18} />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[170px]">
          <DropdownMenuItem className="cursor-pointer" onClick={() => setIsViewOpen(true)}>
            View Quiz
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onClick={() => setIsEditOpen(true)}>
            Edit Quiz
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            variant="destructive"
            onClick={() => setIsDeleteOpen(true)}
          >
            Delete
            <DropdownMenuShortcut className="text-destructive">Del</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ViewQuizModal
        quiz={quiz}
        trigger={null}
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
      />
      <EditQuizModal
        quiz={quiz}
        onUpdateQuiz={onUpdateQuiz}
        trigger={null}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
      <DeleteConfirmationModal
        quiz={quiz}
        trigger={null}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onQuizDeleted={onDeleteQuiz}
      />
    </>
  )
}
