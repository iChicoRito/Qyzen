'use client'

import type { ColumnDef } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'

import type { Score } from '../data/schema'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'

// getStatusClassName - build score status badge color
function getStatusClassName(status: 'passed' | 'failed') {
  if (status === 'passed') {
    return 'rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500'
  }

  return 'rounded-md border-0 bg-rose-500/10 px-2.5 py-0.5 text-rose-500'
}

export const columns: ColumnDef<Score>[] = [
  {
    id: 'search',
    accessorFn: (row) => `${row.moduleCode} ${row.subjectName} ${row.sectionName} ${row.termName}`,
    enableHiding: true,
    header: () => null,
    cell: () => null,
    filterFn: (row, id, value) =>
      String(row.getValue(id)).toLowerCase().includes(String(value).toLowerCase()),
  },
  {
    accessorKey: 'moduleCode',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Module" />,
    cell: ({ row }) => (
      <div className="min-w-[120px] font-medium">{row.original.moduleCode}</div>
    ),
    filterFn: (row, id, value) => row.getValue(id) === value,
  },
  {
    accessorKey: 'subjectName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Subject" />,
    cell: ({ row }) => (
      <div className="min-w-[220px]">
        <div className="font-medium uppercase">{row.original.subjectName}</div>
        <div className="text-muted-foreground text-sm">{row.original.sectionName}</div>
      </div>
    ),
    filterFn: (row, id, value) => row.getValue(id) === value,
  },
  {
    accessorKey: 'termName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Academic Term" />,
    cell: ({ row }) => <div className="min-w-[180px]">{row.original.termName}</div>,
    filterFn: (row, id, value) => row.getValue(id) === value,
  },
  {
    id: 'scoreSummary',
    accessorFn: (row) => `${row.score}/${row.totalQuestions}`,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Score" />,
    cell: ({ row }) => (
      <div className="min-w-[110px] font-medium">
        {row.original.score} / {row.original.totalQuestions}
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
      <div className="min-w-[190px] text-sm">{row.original.submittedAt || 'Not submitted'}</div>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
