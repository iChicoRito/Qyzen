'use client'

import type { HTMLAttributes } from 'react'
import type { Column } from '@tanstack/react-table'
import {
  IconChevronDown,
  IconChevronUp,
  IconSelector,
} from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DataTableColumnHeaderProps<TData, TValue>
  extends HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title: string
}

// DataTableColumnHeader - render a sortable column header
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
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 cursor-pointer hover:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        <span>{title}</span>
        {column.getIsSorted() === 'desc' ? (
          <IconChevronDown size={16} className="ml-2" />
        ) : column.getIsSorted() === 'asc' ? (
          <IconChevronUp size={16} className="ml-2" />
        ) : (
          <IconSelector size={16} className="ml-2" />
        )}
      </Button>
    </div>
  )
}
