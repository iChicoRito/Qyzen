'use client'

import type { ColumnDef } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

import { semesters, statuses } from '../data/data'
import type { AcademicTerm } from '../data/schema'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'

interface GetColumnsProps {
  onDeleteAcademicTerm?: (academicTerm: AcademicTerm) => Promise<void>
}

// getColumns - build academic term columns
export function getColumns({ onDeleteAcademicTerm }: GetColumnsProps): ColumnDef<AcademicTerm>[] {
  return [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
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
    accessorKey: 'academicTermName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Academic Term Name" />,
    cell: ({ row }) => (
      <div className="w-[180px] whitespace-normal font-medium">{row.getValue('academicTermName')}</div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: 'semester',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Semester" />,
    cell: ({ row }) => {
      const semester = semesters.find((item) => item.value === row.getValue('semester'))

      if (!semester) {
        return null
      }

      return <div className="w-[150px]">{semester.label}</div>
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'academicYear',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Academic Year" />,
    cell: ({ row }) => <div className="w-[150px]">{row.getValue('academicYear')}</div>,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = statuses.find((item) => item.value === row.getValue('status'))

      if (!status) {
        return null
      }

      return (
        <div className="flex items-center">
          <Badge
            variant="outline"
            className={
              status.value === 'active'
                ? 'rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500'
                : 'rounded-md border-0 bg-rose-500/10 px-2.5 py-0.5 text-rose-500'
            }
          >
            {status.label}
          </Badge>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
  ]
}
