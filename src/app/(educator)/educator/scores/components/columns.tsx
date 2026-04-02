'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { IconArrowUpRight } from '@tabler/icons-react'

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
        <div className="min-w-[180px] space-y-1">
          <div className="font-medium whitespace-normal">{row.original.moduleCode}</div>
          <div className="text-muted-foreground text-sm whitespace-normal">{row.original.subjectName}</div>
        </div>
      ),
      filterFn: (row, id, value) => row.getValue(id) === value,
    },
    {
      accessorKey: 'subjectName',
      header: () => null,
      cell: () => null,
      enableHiding: true,
      filterFn: (row, id, value) => row.getValue(id) === value,
    },
    {
      accessorKey: 'sectionName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Section" />,
      cell: ({ row }) => (
        <div className="min-w-[180px]">
          <div className="font-medium whitespace-normal">{row.original.sectionName}</div>
          <div className="text-muted-foreground text-sm whitespace-normal">{row.original.termName}</div>
        </div>
      ),
      filterFn: (row, id, value) => row.getValue(id) === value,
    },
    {
      id: 'scoreSummary',
      accessorFn: (row) => `${row.score}/${row.totalQuestions} ${row.percentage}`,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Highest Score" />,
      cell: ({ row }) => (
        <div className="min-w-[170px] space-y-1">
          <div>
            {row.original.score} / {row.original.totalQuestions}
          </div>
          <div className="text-muted-foreground text-xs">{row.original.percentage}% highest score</div>
        </div>
      ),
    },
    {
      id: 'latestAttempt',
      accessorFn: (row) => `${row.latestScore}/${row.latestTotalQuestions} ${row.latestPercentage}`,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Latest Attempt" />,
      cell: ({ row }) => (
        <div className="min-w-[170px] space-y-1">
          <div className="flex items-center gap-2 font-medium">
            <span>
              {row.original.latestScore} / {row.original.latestTotalQuestions}
            </span>
            <IconArrowUpRight size={14} className="text-muted-foreground" />
          </div>
          <div className="text-muted-foreground text-xs">{row.original.latestPercentage}% latest score</div>
        </div>
      ),
    },
    {
      accessorKey: 'submittedAttemptCount',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Attempts" />,
      cell: ({ row }) => (
        <div className="min-w-[130px] space-y-1 whitespace-normal">
          <div className="font-medium">{row.original.submittedAttemptCount}</div>
          <div className="text-muted-foreground text-xs">
            Remaining: {row.original.remainingRetakes}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => (
        <div className="min-w-[140px] space-y-1">
          <Badge className={getStatusClassName(row.original.status)}>{row.original.status}</Badge>
          <div className="text-muted-foreground text-xs">
            Latest: {row.original.latestStatus}
          </div>
        </div>
      ),
      filterFn: (row, id, value) => row.getValue(id) === value,
    },
    {
      accessorKey: 'latestSubmittedAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Last Submitted" />,
      cell: ({ row }) => (
        <div className="min-w-[190px] space-y-1 text-sm whitespace-normal">
          <div>{row.original.latestSubmittedAt || 'Not submitted'}</div>
          <div className="text-muted-foreground text-xs">
            Extra retakes: {row.original.grantedRetakeCount}
          </div>
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => <DataTableRowActions row={row} onScoresChanged={onScoresChanged} />,
    },
  ]
}
