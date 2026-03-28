'use client'

import type { ColumnDef } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { type SectionPermissions } from '@/lib/auth/section-permissions'
import { type SectionRecord } from '@/lib/supabase/sections'

import type { Section } from '../data/schema'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'

interface ColumnsProps {
  permissions: SectionPermissions
  onUpdateSection?: (section: SectionRecord) => void
  onDeleteSection?: (sectionId: number) => void
}

// getStatusClassName - build badge color by status
function getStatusClassName(status: 'active' | 'inactive') {
  if (status === 'active') {
    return 'rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500'
  }

  return 'rounded-md border-0 bg-rose-500/10 px-2.5 py-0.5 text-rose-500'
}

// getColumns - build section table columns
export function getColumns({ permissions, onUpdateSection, onDeleteSection }: ColumnsProps): ColumnDef<Section>[] {
  const columns: ColumnDef<Section>[] = [
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
      accessorKey: 'sectionName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Section Name" />,
      cell: ({ row }) => (
        <div className="max-w-[220px] truncate font-medium">{row.getValue('sectionName')}</div>
      ),
    },
    {
      id: 'academicTerms',
      accessorFn: (row) => row.academicTerms.map((academicTerm) => academicTerm.label).join(', '),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Academic Terms" />,
      cell: ({ row }) => (
        <div className="flex max-w-[320px] flex-wrap gap-2">
          {row.original.academicTerms.map((academicTerm) => (
            <Badge
              key={academicTerm.id}
              variant="outline"
              className="rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-blue-500"
            >
              {academicTerm.label}
            </Badge>
          ))}
        </div>
      ),
      filterFn: (row, id, value) => {
        const rowValue = String(row.getValue(id)).toLowerCase()
        return rowValue.includes(String(value).toLowerCase())
      },
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
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DataTableRowActions
          row={row}
          permissions={permissions}
          onSectionUpdated={onUpdateSection}
          onSectionDeleted={onDeleteSection}
        />
      ),
    },
  ]

  if (!permissions.canUpdate && !permissions.canDelete) {
    return columns.filter((column) => column.id !== 'select')
  }

  return columns
}
