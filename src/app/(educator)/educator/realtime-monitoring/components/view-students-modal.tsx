'use client'

import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import {
  IconChevronDown,
  IconChevronUp,
  IconEye,
  IconSelector,
} from '@tabler/icons-react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from '@/components/ui/responsive-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import {
  getAssessmentStatusClassName,
  getAssessmentStatusLabel,
  getLatestAttemptStatusLabel,
  getPresenceStatusClassName,
  getPresenceStatusLabel,
} from '../data/data'
import type { EducatorRealtimeMonitoringRow } from '../data/schema'

interface ViewStudentsModalProps {
  row: EducatorRealtimeMonitoringRow
  trigger?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

type StudentSortKey =
  | 'student'
  | 'assessmentStatus'
  | 'presenceStatus'
  | 'lastSeenAt'
  | 'currentPath'
  | 'latestAttempt'
  | 'warningAttempts'
  | 'latestTakenAt'
  | 'latestSubmittedAt'

type StudentSortDirection = 'asc' | 'desc'

// formatDateTimeLabel - format nullable timestamps for the modal
function formatDateTimeLabel(value: string | null) {
  if (!value) {
    return 'Not available'
  }

  const timestamp = new Date(value)

  if (Number.isNaN(timestamp.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(timestamp)
}

// getLatestAttemptSummary - build a short latest attempt summary
function getLatestAttemptSummary(student: EducatorRealtimeMonitoringRow['students'][number]) {
  if (student.latestAttemptStatus === 'NOT_STARTED') {
    return 'No attempt yet'
  }

  if (student.latestAttemptStatus === 'IN_PROGRESS') {
    return `In progress${student.latestTotalQuestions ? ` - ${student.latestTotalQuestions} questions` : ''}`
  }

  if (student.latestScore === null || student.latestTotalQuestions === null) {
    return getLatestAttemptStatusLabel(student.latestAttemptStatus)
  }

  return `${getLatestAttemptStatusLabel(student.latestAttemptStatus)} - ${student.latestScore}/${student.latestTotalQuestions}`
}

// getStudentSortValue - map one student to a sortable value
function getStudentSortValue(
  student: EducatorRealtimeMonitoringRow['students'][number],
  key: StudentSortKey
) {
  if (key === 'student') {
    return `${student.studentName} ${student.studentUserId}`.toLowerCase()
  }

  if (key === 'assessmentStatus') {
    return getAssessmentStatusLabel(student.assessmentStatus)
  }

  if (key === 'presenceStatus') {
    return getPresenceStatusLabel(student.presenceStatus)
  }

  if (key === 'lastSeenAt') {
    return new Date(student.lastSeenAt || '').getTime() || 0
  }

  if (key === 'currentPath') {
    return (student.currentPath || '').toLowerCase()
  }

  if (key === 'latestAttempt') {
    return getLatestAttemptSummary(student).toLowerCase()
  }

  if (key === 'warningAttempts') {
    return student.warningAttempts
  }

  if (key === 'latestTakenAt') {
    return new Date(student.latestTakenAt || '').getTime() || 0
  }

  return new Date(student.latestSubmittedAt || '').getTime() || 0
}

// sortStudents - sort modal students by the selected key and direction
function sortStudents(
  students: EducatorRealtimeMonitoringRow['students'],
  key: StudentSortKey,
  direction: StudentSortDirection
) {
  return [...students].sort((leftStudent, rightStudent) => {
    const leftValue = getStudentSortValue(leftStudent, key)
    const rightValue = getStudentSortValue(rightStudent, key)

    if (leftValue === rightValue) {
      return leftStudent.studentName.localeCompare(rightStudent.studentName)
    }

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return direction === 'asc' ? leftValue - rightValue : rightValue - leftValue
    }

    return direction === 'asc'
      ? String(leftValue).localeCompare(String(rightValue))
      : String(rightValue).localeCompare(String(leftValue))
  })
}

// SortableTableHead - render one sortable modal table header
function SortableTableHead({
  title,
  sortKey,
  activeKey,
  direction,
  onSort,
}: {
  title: string
  sortKey: StudentSortKey
  activeKey: StudentSortKey
  direction: StudentSortDirection
  onSort: (key: StudentSortKey) => void
}) {
  const isActive = activeKey === sortKey

  return (
    <TableHead>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 cursor-pointer px-3 hover:bg-accent"
        onClick={() => onSort(sortKey)}
      >
        <span>{title}</span>
        {isActive ? (
          direction === 'asc' ? (
            <IconChevronUp size={16} className="ml-2" />
          ) : (
            <IconChevronDown size={16} className="ml-2" />
          )
        ) : (
          <IconSelector size={16} className="ml-2" />
        )}
      </Button>
    </TableHead>
  )
}

// ViewStudentsModal - display monitored students for one module
export function ViewStudentsModal({
  row,
  trigger,
  open,
  onOpenChange,
}: ViewStudentsModalProps) {
  // ==================== STATE ====================
  const [internalOpen, setInternalOpen] = useState(false)
  const [sortKey, setSortKey] = useState<StudentSortKey>('student')
  const [sortDirection, setSortDirection] = useState<StudentSortDirection>('asc')
  const dialogOpen = open ?? internalOpen
  const setDialogOpen = onOpenChange ?? setInternalOpen

  // ==================== SORTED STUDENTS ====================
  const sortedStudents = useMemo(
    () => sortStudents(row.students, sortKey, sortDirection),
    [row.students, sortDirection, sortKey]
  )

  // ==================== HANDLE SORT ====================
  const handleSort = (nextKey: StudentSortKey) => {
    if (sortKey === nextKey) {
      setSortDirection((currentDirection) => (currentDirection === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortKey(nextKey)
    setSortDirection('asc')
  }

  return (
    <ResponsiveDialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger ? (
        <ResponsiveDialogTrigger asChild>{trigger}</ResponsiveDialogTrigger>
      ) : open === undefined ? (
        <ResponsiveDialogTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="cursor-pointer">
            <IconEye size={18} />
            View Students
          </Button>
        </ResponsiveDialogTrigger>
      ) : null}
      <ResponsiveDialogContent className="flex h-[85vh] w-full flex-col gap-0 p-0" desktopClassName="w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] sm:h-[88vh] sm:max-w-[1100px] xl:max-w-[1320px]">
        <ResponsiveDialogHeader className="border-b px-4 pt-5 pb-4 sm:px-6 sm:pt-6">
          <ResponsiveDialogTitle>Monitor Students</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Review live student activity for this assessment module.
          </ResponsiveDialogDescription>

          <div className="mt-4 border-t pt-4">
            <Accordion type="single" collapsible className="rounded-md border px-4">
              <AccordionItem value="assessment-details" className="border-b-0">
                <AccordionTrigger className="cursor-pointer py-3 text-base hover:no-underline">
                  Assessment Details
                </AccordionTrigger>
                <AccordionContent className="pt-1">
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="space-y-1">
                      <div className="text-muted-foreground text-xs uppercase">Module</div>
                      <div className="text-sm font-semibold sm:text-base">{row.moduleCode}</div>
                      <div className="text-muted-foreground break-all text-sm">{row.moduleId}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground text-xs uppercase">Subject</div>
                      <div className="text-sm font-semibold sm:text-base">{row.subjectName}</div>
                      <div className="text-muted-foreground text-sm">{row.termName}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground text-xs uppercase">Section</div>
                      <div className="text-sm font-semibold sm:text-base">{row.sectionName}</div>
                      <div className="text-muted-foreground text-sm">{row.questionCount} questions</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground text-xs uppercase">Overview</div>
                      <div className="text-sm font-semibold sm:text-base">
                        {row.enrolledCount} enrolled
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {row.answeringCount} answering, {row.onlineCount} online, {row.finishedCount} finished
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </ResponsiveDialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {row.students.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center text-sm">
              No enrolled students found for this module.
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table className="min-w-[1080px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8 cursor-pointer px-3 hover:bg-accent"
                        onClick={() => handleSort('student')}
                      >
                        <span>Student</span>
                        {sortKey === 'student' ? (
                          sortDirection === 'asc' ? (
                            <IconChevronUp size={16} className="ml-2" />
                          ) : (
                            <IconChevronDown size={16} className="ml-2" />
                          )
                        ) : (
                          <IconSelector size={16} className="ml-2" />
                        )}
                      </Button>
                    </TableHead>
                    <SortableTableHead
                      title="Status"
                      sortKey="assessmentStatus"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableTableHead
                      title="Last Seen"
                      sortKey="lastSeenAt"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableTableHead
                      title="Current Page"
                      sortKey="currentPath"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableTableHead
                      title="Latest Attempt"
                      sortKey="latestAttempt"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableTableHead
                      title="Warnings"
                      sortKey="warningAttempts"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableTableHead
                      title="Taken At"
                      sortKey="latestTakenAt"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableTableHead
                      title="Submitted At"
                      sortKey="latestSubmittedAt"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedStudents.map((student) => (
                    <TableRow key={student.studentId}>
                      <TableCell className="align-top pl-4">
                        <div className="min-w-[200px]">
                          <div className="font-medium whitespace-normal">{student.studentName}</div>
                          <div className="text-muted-foreground text-sm whitespace-normal">
                            {student.studentUserId}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex min-w-[140px] flex-col items-start gap-1">
                          <Badge
                            className={`${getAssessmentStatusClassName(student.assessmentStatus)} px-2 py-0.5 text-[11px]`}
                          >
                            {getAssessmentStatusLabel(student.assessmentStatus)}
                          </Badge>
                          <Badge
                            className={`${getPresenceStatusClassName(student.presenceStatus)} px-2 py-0.5 text-[11px]`}
                          >
                            {getPresenceStatusLabel(student.presenceStatus)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="min-w-[150px] whitespace-normal text-sm font-medium">
                          {formatDateTimeLabel(student.lastSeenAt)}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="min-w-[180px] break-all text-sm font-medium">
                          {student.currentPath || 'Not available'}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="min-w-[150px] whitespace-normal text-sm font-medium">
                          {getLatestAttemptSummary(student)}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="min-w-[70px] text-sm font-medium">{student.warningAttempts}</div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="min-w-[150px] whitespace-normal text-sm font-medium">
                          {formatDateTimeLabel(student.latestTakenAt)}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="min-w-[150px] whitespace-normal text-sm font-medium">
                          {formatDateTimeLabel(student.latestSubmittedAt)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <ResponsiveDialogFooter className="sm:justify-start sm:px-6">
          <ResponsiveDialogClose asChild>
            <Button type="button" variant="outline" className="cursor-pointer">
              Close
            </Button>
          </ResponsiveDialogClose>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
