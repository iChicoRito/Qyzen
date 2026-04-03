'use client'

import type { Table } from '@tanstack/react-table'
import { IconRefresh } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import type { EducatorManagedGroupChatRow } from '../data/schema'
import { AddGroupChatModal } from './add-groupchat-modal'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  openCreateModal?: boolean
  onCreateModalOpenChange?: (open: boolean) => void
  onGroupChatCreated?: (groupChat: EducatorManagedGroupChatRow) => void
}

// DataTableToolbar - render filters and modal actions for the group chat table
export function DataTableToolbar<TData>({
  table,
  openCreateModal,
  onCreateModalOpenChange,
  onGroupChatCreated,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Input
            placeholder="Search subject"
            value={(table.getColumn('subjectName')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('subjectName')?.setFilterValue(event.target.value)}
            className="w-full cursor-text sm:flex-1 lg:max-w-[300px]"
          />
          <Input
            placeholder="Search section"
            value={(table.getColumn('sectionName')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('sectionName')?.setFilterValue(event.target.value)}
            className="w-full cursor-text sm:flex-1 lg:max-w-[220px]"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => table.resetColumnFilters()}
            className="w-full cursor-pointer px-3 sm:w-auto"
            disabled={!isFiltered}
          >
            <IconRefresh size={18} />
            <span className="hidden lg:block">Reset Filters</span>
          </Button>
        </div>

        <AddGroupChatModal
          onGroupChatCreated={onGroupChatCreated}
          open={openCreateModal}
          onOpenChange={onCreateModalOpenChange}
        />
      </div>
    </div>
  )
}
