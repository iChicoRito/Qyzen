'use client'

import type { ColumnDef } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

import type { Quiz } from '../data/schema'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'

interface ColumnsProps {
  onDeleteQuiz?: (quizId: number) => Promise<void> | void
  onUpdateQuiz?: (quiz: Quiz) => Promise<void> | void
}

// getColumns - build quiz table columns
export function getColumns({ onDeleteQuiz, onUpdateQuiz }: ColumnsProps): ColumnDef<Quiz>[] {
  return [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px] cursor-pointer"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px] cursor-pointer"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'moduleCode',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Module" />,
    cell: ({ row }) => (
      <div className="min-w-[220px] whitespace-normal">
        <p className="font-medium">{row.original.moduleCode}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <p className="text-sm text-muted-foreground">{row.original.subjectName}</p>
          <Badge variant="outline" className="rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-blue-500">
            {row.original.sectionName}
          </Badge>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'termName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Term" />,
    cell: ({ row }) => <div className="min-w-[160px]">{row.getValue('termName')}</div>,
  },
  {
    accessorKey: 'subjectName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Subject" />,
    cell: ({ row }) => <div className="min-w-[180px] whitespace-normal">{row.getValue('subjectName')}</div>,
  },
  {
    accessorKey: 'sectionName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Section" />,
    cell: ({ row }) => <div className="min-w-[180px] whitespace-normal">{row.getValue('sectionName')}</div>,
  },
  {
    accessorKey: 'question',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Question" />,
    cell: ({ row }) => (
      <div className="max-w-[420px] whitespace-normal font-medium">
        {row.getValue('question')}
      </div>
    ),
  },
  {
    accessorKey: 'quizType',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Quiz Type" />,
    cell: ({ row }) => {
      const quizType = row.getValue('quizType') as 'multiple_choice' | 'identification'

      return (
        <Badge variant="outline">
          {quizType === 'multiple_choice' ? 'Multiple Choice' : 'Identification'}
        </Badge>
      )
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    id: 'answer',
    accessorFn: (row) => row.correctAnswers.join(', '),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Correct Answer" />,
    cell: ({ row }) => (
      <div className="min-w-[220px] whitespace-normal text-sm">
        {row.original.correctAnswers.join(', ')}
      </div>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DataTableRowActions
        row={row}
        onDeleteQuiz={onDeleteQuiz}
        onUpdateQuiz={onUpdateQuiz}
      />
    ),
  },
  ]
}
