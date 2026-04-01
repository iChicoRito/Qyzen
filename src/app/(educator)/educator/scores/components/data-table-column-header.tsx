'use client'

import type { Column } from '@tanstack/react-table'
import {
  IconArrowDown,
  IconArrowUp,
  IconSelector,
} from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title: string
}

// DataTableColumnHeader - render sortable educator table headers
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
          <IconArrowDown size={16} className="ml-2" />
        ) : column.getIsSorted() === 'asc' ? (
          <IconArrowUp size={16} className="ml-2" />
        ) : (
          <IconSelector size={16} className="ml-2" />
        )}
      </Button>
    </div>
  )
}
