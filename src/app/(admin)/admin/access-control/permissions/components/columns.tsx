'use client'

import type { ColumnDef } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

import { statuses } from '../data/data'
import type { Permission } from '../data/schema'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'

export const columns: ColumnDef<Permission>[] = [
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
    accessorKey: 'permissionName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Permission Name" />,
    cell: ({ row }) => (
      <div className="w-[200px] font-medium">{row.getValue('permissionName')}</div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: 'role',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
    cell: ({ row }) => <div className="w-[160px]">{row.getValue('role')}</div>,
  },
  {
    accessorKey: 'action',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Action" />,
    cell: ({ row }) => <div className="capitalize">{row.getValue('action')}</div>,
  },
  {
    accessorKey: 'module',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Module" />,
    cell: ({ row }) => <div>{row.getValue('module')}</div>,
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
