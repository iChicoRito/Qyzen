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
  onUploadQuizzes?: (quizzes: Quiz[]) => Promise<void> | void
}

// DataTableToolbar - filter and create quiz rows
export function DataTableToolbar<TData>({
  table,
  onAddQuiz,
  onUploadQuizzes,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

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

  // handleSubjectChange - update subject filter
  const handleSubjectChange = (value: string) => {
    const column = table.getColumn('subjectName')

    if (value === 'all') {
      column?.setFilterValue(undefined)
    } else {
      column?.setFilterValue(value)
    }
  }

  // handleSectionChange - update section filter
  const handleSectionChange = (value: string) => {
    const column = table.getColumn('sectionName')

    if (value === 'all') {
      column?.setFilterValue(undefined)
    } else {
      column?.setFilterValue(value)
    }
  }

  const moduleFilter = table.getColumn('moduleCode')?.getFilterValue() as string | undefined
  const termFilter = table.getColumn('termName')?.getFilterValue() as string[] | undefined
  const subjectFilter = table.getColumn('subjectName')?.getFilterValue() as string | undefined
  const sectionFilter = table.getColumn('sectionName')?.getFilterValue() as string | undefined
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
  const subjectOptions = Array.from(
    new Set(
      table
        .getCoreRowModel()
        .rows
        .map((row) => String(row.getValue('subjectName')))
        .filter(Boolean)
    )
  ).sort((left, right) => left.localeCompare(right))
  const sectionOptions = Array.from(
    new Set(
      table
        .getCoreRowModel()
        .rows
        .map((row) => String(row.getValue('sectionName')))
        .filter(Boolean)
    )
  ).sort((left, right) => left.localeCompare(right))

  return (
    <div className="min-w-0 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Select value={moduleFilter || 'all'} onValueChange={handleModuleChange}>
          <SelectTrigger className="w-full cursor-pointer sm:w-[180px]">
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
          <SelectTrigger className="w-full cursor-pointer sm:w-[180px]">
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
        <Select value={subjectFilter || 'all'} onValueChange={handleSubjectChange}>
          <SelectTrigger className="w-full cursor-pointer sm:w-[180px]">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="cursor-pointer">
              All Subjects
            </SelectItem>
            {subjectOptions.map((subjectName) => (
              <SelectItem key={subjectName} value={subjectName} className="cursor-pointer">
                {subjectName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sectionFilter || 'all'} onValueChange={handleSectionChange}>
          <SelectTrigger className="w-full cursor-pointer sm:w-[180px]">
            <SelectValue placeholder="Section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="cursor-pointer">
              All Sections
            </SelectItem>
            {sectionOptions.map((sectionName) => (
              <SelectItem key={sectionName} value={sectionName} className="cursor-pointer">
                {sectionName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => table.resetColumnFilters()}
          className="w-full cursor-pointer px-3 sm:w-auto"
          disabled={!isFiltered}
        >
          <IconRefresh size={18} />
          <span className="hidden lg:block">Reset Filters</span>
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
        <DataTableViewOptions table={table} />
        <AddQuizModal onAddQuiz={onAddQuiz} onUploadQuizzes={onUploadQuizzes} />
      </div>
    </div>
  )
}
