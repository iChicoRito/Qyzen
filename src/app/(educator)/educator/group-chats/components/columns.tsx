'use client'

import type { ColumnDef } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'

import type { EducatorManagedGroupChatRow } from '../data/schema'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'

interface ColumnsProps {
  onGroupChatDeleted?: (groupChatId: number) => void
}

// getColumns - build educator group chat management columns
export function getColumns({ onGroupChatDeleted }: ColumnsProps): ColumnDef<EducatorManagedGroupChatRow>[] {
  return [
    {
      accessorKey: 'subjectName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Subject" />,
      cell: ({ row }) => (
        <div className="space-y-1">
          <p className="max-w-[260px] whitespace-normal font-medium">{row.original.subjectName}</p>
          <p className="text-xs text-muted-foreground">Chat #{row.original.id}</p>
        </div>
      ),
    },
    {
      accessorKey: 'sectionName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Section" />,
      cell: ({ row }) => (
        <Badge variant="outline" className="rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-blue-500">
          {row.original.sectionName}
        </Badge>
      ),
      filterFn: (row, id, value) =>
        String(row.getValue(id)).toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      accessorKey: 'studentCount',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Students" />,
      cell: ({ row }) => <span className="font-medium">{row.original.studentCount}</span>,
    },
    {
      accessorKey: 'onlineStudentCount',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Online" />,
      cell: ({ row }) => <span className="font-medium text-green-500">{row.original.onlineStudentCount}</span>,
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }).format(new Date(row.original.createdAt))}
        </span>
      ),
      sortingFn: 'datetime',
    },
    {
      id: 'actions',
      cell: ({ row }) => <DataTableRowActions row={row} onGroupChatDeleted={onGroupChatDeleted} />,
    },
  ]
}
