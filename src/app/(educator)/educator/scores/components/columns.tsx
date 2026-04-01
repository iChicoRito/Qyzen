'use client'

import type { ColumnDef } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'

import type { EducatorScore } from '../data/schema'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'

// getStatusClassName - build score status badge color
function getStatusClassName(status: 'passed' | 'failed') {
  if (status === 'passed') {
    return 'rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500'
  }

  return 'rounded-md border-0 bg-rose-500/10 px-2.5 py-0.5 text-rose-500'
}

// columns - build educator score table columns
export function columns(onScoresChanged: () => Promise<void>): ColumnDef<EducatorScore>[] {
  return [
    {
      id: 'search',
      accessorFn: (row) =>
        `${row.studentName} ${row.studentUserId} ${row.moduleCode} ${row.subjectName} ${row.sectionName} ${row.termName}`,
      enableHiding: true,
      header: () => null,
      cell: () => null,
      filterFn: (row, id, value) =>
        String(row.getValue(id)).toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      accessorKey: 'studentName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Student" />,
      cell: ({ row }) => (
        <div className="min-w-[180px]">
          <div className="font-medium whitespace-normal">{row.original.studentName}</div>
          <div className="text-muted-foreground text-sm whitespace-normal">{row.original.studentUserId}</div>
        </div>
      ),
      filterFn: (row, id, value) => row.getValue(id) === value,
    },
    {
      accessorKey: 'moduleCode',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Module" />,
      cell: ({ row }) => (
        <div className="min-w-[120px] font-medium whitespace-normal">{row.original.moduleCode}</div>
      ),
      filterFn: (row, id, value) => row.getValue(id) === value,
    },
    {
      accessorKey: 'subjectName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Subject" />,
      cell: ({ row }) => (
        <div className="min-w-[220px]">
          <div className="font-medium uppercase whitespace-normal">{row.original.subjectName}</div>
          <div className="text-muted-foreground text-sm whitespace-normal">{row.original.sectionName}</div>
        </div>
      ),
      filterFn: (row, id, value) => row.getValue(id) === value,
    },
    {
      accessorKey: 'termName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Academic Term" />,
      cell: ({ row }) => <div className="min-w-[180px] whitespace-normal">{row.original.termName}</div>,
      filterFn: (row, id, value) => row.getValue(id) === value,
    },
    {
      id: 'scoreSummary',
      accessorFn: (row) => `${row.score}/${row.totalQuestions}`,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Score" />,
      cell: ({ row }) => (
        <div className="min-w-[140px] space-y-1 font-medium">
          <div>
            {row.original.score} / {row.original.totalQuestions}
          </div>
          <div className="text-xs text-muted-foreground">
            Best: {row.original.bestScore ?? row.original.score} / {row.original.totalQuestions}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'submittedAttemptCount',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Attempts" />,
      cell: ({ row }) => (
        <div className="min-w-[120px] whitespace-normal">
          <div>{row.original.submittedAttemptCount}</div>
          <div className="text-muted-foreground text-xs">
            Extra: {row.original.grantedRetakeCount}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'percentage',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Percentage" />,
      cell: ({ row }) => <div className="min-w-[110px]">{row.original.percentage}%</div>,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => (
        <Badge className={getStatusClassName(row.original.status)}>{row.original.status}</Badge>
      ),
      filterFn: (row, id, value) => row.getValue(id) === value,
    },
    {
      accessorKey: 'submittedAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Submitted At" />,
      cell: ({ row }) => (
        <div className="min-w-[190px] text-sm whitespace-normal">{row.original.submittedAt || 'Not submitted'}</div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => <DataTableRowActions row={row} onScoresChanged={onScoresChanged} />,
    },
  ]
}
