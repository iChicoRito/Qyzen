'use client'

import type { ColumnDef } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

import { statuses } from '../data/data'
import type { Role } from '../data/schema'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'

interface GetColumnsProps {
  onRoleUpdated?: (currentRoleName: string, updatedRole: Role) => void
  onDeleteRole?: (role: Role) => Promise<void>
}

// getColumns - build role columns
export function getColumns({
  onRoleUpdated,
  onDeleteRole,
}: GetColumnsProps): ColumnDef<Role>[] {
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
    accessorKey: 'roleName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Role Name" />,
    cell: ({ row }) => <div className="w-[180px] font-medium">{row.getValue('roleName')}</div>,
    enableHiding: false,
  },
  {
    accessorKey: 'description',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
    cell: ({ row }) => (
      <div className="max-w-[320px] truncate text-muted-foreground">{row.getValue('description')}</div>
    ),
  },
  {
    accessorKey: 'permissionsCount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Permissions" />,
    cell: ({ row }) => (
      <div className="w-[120px] text-muted-foreground">
        {row.getValue<number>('permissionsCount')} applied
      </div>
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
    accessorKey: 'isSystem',
    header: ({ column }) => <DataTableColumnHeader column={column} title="System Role" />,
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={
          row.getValue('isSystem')
            ? 'rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-blue-500'
            : 'rounded-md border bg-border px-2.5 py-0.5 text-muted-foreground'
        }
      >
        {row.getValue('isSystem') ? 'Yes' : 'No'}
      </Badge>
    ),
    filterFn: (row, id, value) => {
      return value.includes(String(row.getValue(id)))
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DataTableRowActions
        row={row}
        onRoleUpdated={onRoleUpdated}
        onDeleteRole={onDeleteRole}
      />
    ),
  },
  ]
}
