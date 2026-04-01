'use client'

import type { ColumnDef } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

import type { QuizGroup } from '../data/schema'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'

interface ColumnsProps {
  onDeleteModuleQuizzes?: (moduleRowId: number) => Promise<void> | void
}

// getColumns - build quiz table columns
export function getColumns({ onDeleteModuleQuizzes }: ColumnsProps): ColumnDef<QuizGroup>[] {
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
    accessorKey: 'totalQuestions',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Questions" />,
    cell: ({ row }) => (
      <div className="min-w-[140px] whitespace-normal font-medium">
        {row.original.totalQuestions}
      </div>
    ),
  },
  {
    accessorKey: 'quizTypeLabel',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Quiz Type" />,
    cell: ({ row }) => {
      return (
        <Badge variant="outline">
          {row.original.quizTypeLabel}
        </Badge>
      )
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    id: 'typeCounts',
    accessorFn: (row) => `${row.multipleChoiceCount} ${row.identificationCount}`,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Question Breakdown" />,
    cell: ({ row }) => (
      <div className="min-w-[220px] whitespace-normal text-sm">
        <div>Multiple Choice: {row.original.multipleChoiceCount}</div>
        <div>Identification: {row.original.identificationCount}</div>
      </div>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DataTableRowActions
        row={row}
        onDeleteModuleQuizzes={onDeleteModuleQuizzes}
      />
    ),
  },
  ]
}
