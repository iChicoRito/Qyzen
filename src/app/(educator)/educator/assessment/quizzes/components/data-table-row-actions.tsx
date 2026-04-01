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

import type { QuizGroup } from '../data/schema'
import { quizGroupSchema } from '../data/schema'
import { DeleteConfirmationModal } from './delete-confirmation-modal'
import { ViewQuizModal } from './view-quiz-modal'

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  onDeleteModuleQuizzes?: (moduleRowId: number) => Promise<void> | void
}

// DataTableRowActions - render quiz row actions
export function DataTableRowActions<TData>({
  row,
  onDeleteModuleQuizzes,
}: DataTableRowActionsProps<TData>) {
  const quizGroup = quizGroupSchema.parse(row.original)
  const [isViewOpen, setIsViewOpen] = useState(false)
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
            View Questions
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            variant="destructive"
            onClick={() => setIsDeleteOpen(true)}
          >
            Delete All
            <DropdownMenuShortcut className="text-destructive">Del</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ViewQuizModal
        quizGroup={quizGroup}
        trigger={null}
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
      />
      <DeleteConfirmationModal
        quizGroup={quizGroup}
        trigger={null}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onQuizDeleted={onDeleteModuleQuizzes}
      />
    </>
  )
}
