'use client'

import type { ColumnDef } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { type EnrollmentRecord } from '@/lib/supabase/enrollments'

import type { Enrollment } from '../data/schema'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'

interface ColumnsProps {
  onEnrollmentUpdated?: (enrollment: EnrollmentRecord) => void
  onEnrollmentDeleted?: (id: number) => void
}

// getStatusClassName - build badge class by status
function getStatusClassName(status: 'active' | 'inactive') {
  if (status === 'active') return 'rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500'
  return 'rounded-md border-0 bg-rose-500/10 px-2.5 py-0.5 text-rose-500'
}

// getColumns - build enrollment table columns
export function getColumns({ onEnrollmentUpdated, onEnrollmentDeleted }: ColumnsProps): ColumnDef<Enrollment>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
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
      id: 'studentName',
      accessorFn: (row) => row.student.fullName,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Student Name" />,
      cell: ({ row }) => <div className="max-w-[220px] whitespace-normal font-medium">{row.original.student.fullName}</div>,
    },
    {
      id: 'studentId',
      accessorFn: (row) => row.student.userId,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Student ID" />,
      cell: ({ row }) => <div className="max-w-[140px] whitespace-normal">{row.original.student.userId}</div>,
    },
    {
      id: 'subjectName',
      accessorFn: (row) => `${row.subject.subjectCode} ${row.subject.subjectName}`,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Subject" />,
      cell: ({ row }) => (
        <div className="space-y-1">
          <p className="max-w-[240px] whitespace-normal font-medium">{row.original.subject.subjectName}</p>
          <p className="text-xs text-muted-foreground">{row.original.subject.subjectCode}</p>
        </div>
      ),
    },
    {
      id: 'sectionName',
      accessorFn: (row) => row.subject.section.name,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Section" />,
      cell: ({ row }) => (
        <Badge variant="outline" className="rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-blue-500">
          {row.original.subject.section.name}
        </Badge>
      ),
      filterFn: (row, id, value) => String(row.getValue(id)).toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue('status') as 'active' | 'inactive'
        return (
          <Badge variant="outline" className={getStatusClassName(status)}>
            {status === 'active' ? 'Active' : 'Inactive'}
          </Badge>
        )
      },
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DataTableRowActions row={row} onEnrollmentUpdated={onEnrollmentUpdated} onEnrollmentDeleted={onEnrollmentDeleted} />
      ),
    },
  ]
}
