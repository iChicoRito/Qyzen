'use client'

import { useState } from 'react'
import type { Row } from '@tanstack/react-table'
import {
  IconDotsVertical,
  IconEye,
  IconReload,
} from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { educatorScoreSchema } from '../data/schema'
import { AllowRetakeModal } from './allow-retake-modal'
import { ViewScoresModal } from './view-scores-modal'

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  onScoresChanged: () => Promise<void>
}

// DataTableRowActions - open educator score actions
export function DataTableRowActions<TData>({
  row,
  onScoresChanged,
}: DataTableRowActionsProps<TData>) {
  const score = educatorScoreSchema.parse(row.original)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isRetakeOpen, setIsRetakeOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 cursor-pointer p-0 data-[state=open]:bg-muted"
          >
            <IconDotsVertical size={18} />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
          <DropdownMenuItem className="cursor-pointer" onSelect={() => setIsViewOpen(true)}>
            <IconEye size={16} className="mr-2" />
            View Scores
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onSelect={() => setIsRetakeOpen(true)}>
            <IconReload size={16} className="mr-2" />
            Allow Retake
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ViewScoresModal score={score} open={isViewOpen} onOpenChange={setIsViewOpen} />
      <AllowRetakeModal
        score={score}
        open={isRetakeOpen}
        onOpenChange={setIsRetakeOpen}
        onSaved={onScoresChanged}
      />
    </>
  )
}
