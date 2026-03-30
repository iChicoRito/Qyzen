'use client'

import type { Column } from '@tanstack/react-table'
import { IconArrowsSort, IconSortAscending, IconSortDescending } from '@tabler/icons-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title: string
}

// DataTableColumnHeader - render sortable column labels
export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 cursor-pointer hover:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        <span>{title}</span>
        {column.getIsSorted() === 'desc' ? (
          <IconSortDescending size={16} className="ml-2" />
        ) : column.getIsSorted() === 'asc' ? (
          <IconSortAscending size={16} className="ml-2" />
        ) : (
          <IconArrowsSort size={16} className="ml-2" />
        )}
      </Button>
    </div>
  )
}
