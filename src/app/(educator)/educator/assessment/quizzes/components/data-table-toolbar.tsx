'use client'

import type { Table } from '@tanstack/react-table'
import { IconRefresh } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTableViewOptions } from './data-table-view-options'
import { AddQuizModal } from './add-quiz-modal'
import type { Quiz } from '../data/schema'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  onAddQuiz?: (quiz: Quiz) => Promise<void> | void
}

// DataTableToolbar - filter and create quiz rows
export function DataTableToolbar<TData>({
  table,
  onAddQuiz,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  // handleQuizTypeChange - update quiz type filter
  const handleQuizTypeChange = (value: string) => {
    const column = table.getColumn('quizType')

    if (value === 'all') {
      column?.setFilterValue(undefined)
    } else {
      column?.setFilterValue([value])
    }
  }

  // handleModuleChange - update module filter
  const handleModuleChange = (value: string) => {
    const column = table.getColumn('moduleCode')

    if (value === 'all') {
      column?.setFilterValue(undefined)
    } else {
      column?.setFilterValue(value)
    }
  }

  // handleTermChange - update term filter
  const handleTermChange = (value: string) => {
    const column = table.getColumn('termName')

    if (value === 'all') {
      column?.setFilterValue(undefined)
    } else {
      column?.setFilterValue([value])
    }
  }

  const quizTypeFilter = table.getColumn('quizType')?.getFilterValue() as string[] | undefined
  const moduleFilter = table.getColumn('moduleCode')?.getFilterValue() as string | undefined
  const termFilter = table.getColumn('termName')?.getFilterValue() as string[] | undefined
  const moduleOptions = Array.from(
    new Set(
      table
        .getCoreRowModel()
        .rows
        .map((row) => String(row.getValue('moduleCode')))
        .filter(Boolean)
    )
  ).sort((left, right) => left.localeCompare(right))
  const termOptions = Array.from(
    new Set(
      table
        .getCoreRowModel()
        .rows
        .map((row) => String(row.getValue('termName')))
        .filter(Boolean)
    )
  ).sort((left, right) => left.localeCompare(right))

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex flex-1 items-center gap-2">
        <Select value={quizTypeFilter?.[0] || 'all'} onValueChange={handleQuizTypeChange}>
          <SelectTrigger className="w-[180px] cursor-pointer">
            <SelectValue placeholder="Quiz Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="cursor-pointer">
              All Quiz Types
            </SelectItem>
            <SelectItem value="multiple_choice" className="cursor-pointer">
              Multiple Choice
            </SelectItem>
            <SelectItem value="identification" className="cursor-pointer">
              Identification
            </SelectItem>
          </SelectContent>
        </Select>
        <Select value={moduleFilter || 'all'} onValueChange={handleModuleChange}>
          <SelectTrigger className="w-[180px] cursor-pointer">
            <SelectValue placeholder="Module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="cursor-pointer">
              All Modules
            </SelectItem>
            {moduleOptions.map((moduleCode) => (
              <SelectItem key={moduleCode} value={moduleCode} className="cursor-pointer">
                {moduleCode}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={termFilter?.[0] || 'all'} onValueChange={handleTermChange}>
          <SelectTrigger className="w-[180px] cursor-pointer">
            <SelectValue placeholder="Term" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="cursor-pointer">
              All Terms
            </SelectItem>
            {termOptions.map((termName) => (
              <SelectItem key={termName} value={termName} className="cursor-pointer">
                {termName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => table.resetColumnFilters()}
          className="cursor-pointer px-3"
          disabled={!isFiltered}
        >
          <IconRefresh size={18} />
          <span className="hidden lg:block">Reset Filters</span>
        </Button>
      </div>
      <div className="flex items-center space-x-2">
        <DataTableViewOptions table={table} />
        <AddQuizModal onAddQuiz={onAddQuiz} />
      </div>
    </div>
  )
}
