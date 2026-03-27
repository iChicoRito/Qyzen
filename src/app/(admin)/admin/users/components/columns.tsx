'use client'

import type { ColumnDef } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

import { statuses, userTypes } from '../data/data'
import type { User } from '../data/schema'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'

export const columns: ColumnDef<User>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
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
    accessorKey: 'userId',
    header: ({ column }) => <DataTableColumnHeader column={column} title="User ID" />,
    cell: ({ row }) => <div className="w-[120px] font-medium">{row.getValue('userId')}</div>,
    enableHiding: false,
  },
  {
    accessorKey: 'givenName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Given Name" />,
    cell: ({ row }) => (
      <div className="max-w-[180px] truncate font-medium">{row.getValue('givenName')}</div>
    ),
  },
  {
    accessorKey: 'surname',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Surname" />,
    cell: ({ row }) => <div className="max-w-[180px] truncate">{row.getValue('surname')}</div>,
  },
  {
    accessorKey: 'email',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }) => (
      <div className="max-w-[240px] truncate text-muted-foreground">{row.getValue('email')}</div>
    ),
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
    accessorKey: 'userType',
    header: ({ column }) => <DataTableColumnHeader column={column} title="User Type" />,
    cell: ({ row }) => {
      const value = row.getValue('userType') as User['userType']
      const userType = userTypes.find((item) => item.value === value)

      return (
        <div className="flex items-center">
          <Badge variant="outline">{userType?.label || 'Admin'}</Badge>
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
