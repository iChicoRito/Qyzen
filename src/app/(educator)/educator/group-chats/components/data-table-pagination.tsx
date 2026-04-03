'use client'

import type { Table } from '@tanstack/react-table'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'

interface DataTablePaginationProps<TData> {
  table: Table<TData>
}

// DataTablePagination - render pagination controls for the group chat table
export function DataTablePagination<TData>({ table }: DataTablePaginationProps<TData>) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Showing {table.getRowModel().rows.length} of {table.getFilteredRowModel().rows.length} group chats
      </p>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <IconChevronLeft size={16} />
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
          <IconChevronRight size={16} />
        </Button>
      </div>
    </div>
  )
}
