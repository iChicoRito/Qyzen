'use client'

import type { ColumnDef } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'

import {
  getAssessmentStatusClassName,
  getAssessmentStatusLabel,
  getPresenceStatusClassName,
  getPresenceStatusLabel,
} from '../data/data'
import type { EducatorRealtimeMonitoringRow } from '../data/schema'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'

// columns - build the monitoring table columns
export function columns(
  onMonitorStudents: (moduleRowId: number) => void
): ColumnDef<EducatorRealtimeMonitoringRow>[] {
  return [
    {
      id: 'search',
      accessorFn: (row) =>
        `${row.moduleCode} ${row.moduleId} ${row.subjectName} ${row.sectionName} ${row.termName}`,
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
        <div className="min-w-[200px]">
          <div className="font-medium whitespace-normal">{row.original.moduleCode}</div>
          <div className="text-muted-foreground text-sm whitespace-normal">{row.original.moduleId}</div>
        </div>
      ),
      filterFn: (row, id, value) => row.getValue(id) === value,
    },
    {
      accessorKey: 'subjectName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Subject" />,
      cell: ({ row }) => (
        <div className="min-w-[180px]">
          <div className="font-medium whitespace-normal">{row.original.subjectName}</div>
          <div className="text-muted-foreground text-sm whitespace-normal">{row.original.termName}</div>
        </div>
      ),
      filterFn: (row, id, value) => row.getValue(id) === value,
    },
    {
      accessorKey: 'sectionName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Section" />,
      cell: ({ row }) => <div className="min-w-[160px] font-medium">{row.original.sectionName}</div>,
      filterFn: (row, id, value) => row.getValue(id) === value,
    },
    {
      accessorKey: 'questionCount',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Questions" />,
      cell: ({ row }) => (
        <div className="min-w-[120px]">
          <div className="font-medium">{row.original.questionCount}</div>
          <div className="text-muted-foreground text-xs">{row.original.timeLimitMinutes} min</div>
        </div>
      ),
    },
    {
      accessorKey: 'enrolledCount',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Enrolled" />,
      cell: ({ row }) => <div className="min-w-[100px] font-medium">{row.original.enrolledCount}</div>,
    },
    {
      accessorKey: 'rowAssessmentStatus',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Assessment" />,
      cell: ({ row }) => (
        <div className="min-w-[150px] space-y-2">
          <Badge className={getAssessmentStatusClassName(row.original.rowAssessmentStatus)}>
            {getAssessmentStatusLabel(row.original.rowAssessmentStatus)}
          </Badge>
          <div className="text-muted-foreground text-xs">{row.original.answeringCount} answering</div>
        </div>
      ),
      filterFn: (row, id, value) => row.getValue(id) === value,
    },
    {
      accessorKey: 'rowPresenceStatus',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Presence" />,
      cell: ({ row }) => (
        <div className="min-w-[140px] space-y-2">
          <Badge className={getPresenceStatusClassName(row.original.rowPresenceStatus)}>
            {getPresenceStatusLabel(row.original.rowPresenceStatus)}
          </Badge>
          <div className="text-muted-foreground text-xs">{row.original.onlineCount} connected</div>
        </div>
      ),
      filterFn: (row, id, value) => row.getValue(id) === value,
    },
    {
      id: 'statusCounts',
      accessorFn: (row) =>
        `${row.offlineCount}-${row.onlineCount}-${row.answeringCount}-${row.finishedCount}`,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status Counts" />,
      cell: ({ row }) => (
        <div className="min-w-[220px] space-y-1.5">
          <div className="flex flex-wrap gap-1.5">
            <Badge className="rounded-md border-0 bg-zinc-500/10 px-2 py-0.5 text-xs text-zinc-500">
              OFFLINE {row.original.offlineCount}
            </Badge>
            <Badge className="rounded-md border-0 bg-green-500/10 px-2 py-0.5 text-xs text-green-500">
              ONLINE {row.original.onlineCount}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge className="rounded-md border-0 bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-500">
              ANSWERING {row.original.answeringCount}
            </Badge>
            <Badge className="rounded-md border-0 bg-blue-500/10 px-2 py-0.5 text-xs text-blue-500">
              FINISHED {row.original.finishedCount}
            </Badge>
          </div>
        </div>
      ),
    },
    {
      id: 'actions',
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => <DataTableRowActions row={row} onMonitorStudents={onMonitorStudents} />,
    },
  ]
}
