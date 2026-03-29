'use client'

import type { ColumnDef } from '@tanstack/react-table'

import { type ModulePermissions } from '@/lib/auth/module-permissions'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { type ModuleRecord } from '@/lib/supabase/modules'

import type { Module } from '../data/schema'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'

interface ColumnsProps {
  permissions: ModulePermissions
  onModuleUpdated?: (module: ModuleRecord) => void
  onModuleDeleted?: (moduleId: number) => void
}

// getStatusClassName - build badge color by status
function getStatusClassName(status: 'active' | 'inactive') {
  if (status === 'active') {
    return 'rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500'
  }

  return 'rounded-md border-0 bg-rose-500/10 px-2.5 py-0.5 text-rose-500'
}

// getShuffleClassName - build badge color by shuffle
function getShuffleClassName(isShuffle: boolean) {
  if (isShuffle) {
    return 'rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-blue-500'
  }

  return 'rounded-md border-0 bg-yellow-500/10 px-2.5 py-0.5 text-yellow-500'
}

// getColumns - build module table columns
export function getColumns({
  permissions,
  onModuleUpdated,
  onModuleDeleted,
}: ColumnsProps): ColumnDef<Module>[] {
  const columns: ColumnDef<Module>[] = [
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
      accessorKey: 'moduleId',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Module ID" />,
      cell: ({ row }) => <div className="min-w-[130px] font-medium">{row.getValue('moduleId')}</div>,
    },
    {
      accessorKey: 'moduleCode',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Module Code" />,
      cell: ({ row }) => <div className="min-w-[130px] font-medium">{row.getValue('moduleCode')}</div>,
    },
    {
      accessorKey: 'termName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Term" />,
      cell: ({ row }) => <div className="min-w-[160px]">{row.getValue('termName')}</div>,
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: 'subjectName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Subject" />,
      cell: ({ row }) => (
        <div className="min-w-[220px]">
          <p className="font-medium uppercase">{row.original.subjectName}</p>
          <p className="text-sm text-muted-foreground">{row.original.sectionName}</p>
        </div>
      ),
    },
    {
      accessorKey: 'timeLimit',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Time Limit" />,
      cell: ({ row }) => <div className="min-w-[110px]">{row.getValue('timeLimit')}</div>,
    },
    {
      accessorKey: 'isShuffle',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Shuffle" />,
      cell: ({ row }) => {
        const isShuffle = row.getValue('isShuffle') as boolean

        return (
          <Badge variant="outline" className={getShuffleClassName(isShuffle)}>
            {isShuffle ? 'Enabled' : 'Disabled'}
          </Badge>
        )
      },
      filterFn: (row, id, value) => value.includes(String(row.getValue(id))),
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
      id: 'schedule',
      accessorFn: (row) => `${row.startDate} ${row.startTime} ${row.endDate} ${row.endTime}`,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Schedule" />,
      cell: ({ row }) => (
        <div className="min-w-[180px] text-sm">
          <p className="font-medium">
            {row.original.startDate} {row.original.startTime}
          </p>
          <p className="text-muted-foreground">
            {row.original.endDate} {row.original.endTime}
          </p>
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DataTableRowActions
          row={row}
          permissions={permissions}
          onModuleUpdated={onModuleUpdated}
          onModuleDeleted={onModuleDeleted}
        />
      ),
    },
  ]

  if (!permissions.canDelete) {
    return columns.filter((column) => column.id !== 'select')
  }

  return columns
}
