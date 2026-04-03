'use client'

import type { Column } from '@tanstack/react-table'
import { IconArrowsSort, IconSortAscending, IconSortDescending } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'

interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>
  title: string
}

// DataTableColumnHeader - render a sortable table header trigger
export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const sortDirection = column.getIsSorted()

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 cursor-pointer"
      onClick={() => column.toggleSorting(sortDirection === 'asc')}
    >
      <span>{title}</span>
      {sortDirection === 'asc' ? <IconSortAscending size={16} /> : null}
      {sortDirection === 'desc' ? <IconSortDescending size={16} /> : null}
      {!sortDirection ? <IconArrowsSort size={16} /> : null}
    </Button>
  )
}
