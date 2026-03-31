'use client'

import { useState } from 'react'
import type { Row } from '@tanstack/react-table'
import { IconDotsVertical, IconEye } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import type { Score } from '../data/schema'
import { scoreSchema } from '../data/schema'
import { ViewScoresModal } from './view-scores-modal'

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

// DataTableRowActions - open score review actions
export function DataTableRowActions<TData>({ row }: DataTableRowActionsProps<TData>) {
  const score = scoreSchema.parse(row.original)
  const [open, setOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted cursor-pointer"
          >
            <IconDotsVertical size={18} />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[170px]">
          <DropdownMenuItem className="cursor-pointer" onSelect={() => setOpen(true)}>
            <IconEye size={16} className="mr-2" />
            View Score
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ViewScoresModal score={score} open={open} onOpenChange={setOpen} />
    </>
  )
}
