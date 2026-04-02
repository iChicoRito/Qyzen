import type { ComponentType } from 'react'
import {
  IconCheck,
  IconClockOff,
  IconPencilCheck,
  IconUserCheck,
} from '@tabler/icons-react'

import type {
  StudentAssessmentStatus,
  StudentMonitoringStatus,
  StudentPresenceStatus,
} from './schema'

// monitoringStatusOptions - provide status filter options
export const monitoringStatusOptions = [
  {
    value: 'OFFLINE',
    label: 'Offline',
    icon: IconClockOff,
  },
  {
    value: 'ONLINE',
    label: 'Online',
    icon: IconUserCheck,
  },
  {
    value: 'ANSWERING',
    label: 'Answering',
    icon: IconPencilCheck,
  },
  {
    value: 'FINISHED',
    label: 'Finished',
    icon: IconCheck,
  },
] satisfies Array<{
  value: StudentMonitoringStatus
  label: string
  icon: ComponentType<{ className?: string; size?: number }>
}>

// getMonitoringStatusClassName - map monitoring status to badge classes
export function getMonitoringStatusClassName(status: StudentMonitoringStatus) {
  if (status === 'ONLINE') {
    return 'rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500'
  }

  if (status === 'FINISHED') {
    return 'rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-blue-500'
  }

  if (status === 'ANSWERING') {
    return 'rounded-md border-0 bg-yellow-500/10 px-2.5 py-0.5 text-yellow-500'
  }

  return 'rounded-md border-0 bg-zinc-500/10 px-2.5 py-0.5 text-zinc-500'
}

// getPresenceStatusClassName - map presence status to badge classes
export function getPresenceStatusClassName(status: StudentPresenceStatus) {
  if (status === 'ONLINE') {
    return 'rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500'
  }

  return 'rounded-md border-0 bg-zinc-500/10 px-2.5 py-0.5 text-zinc-500'
}

// getAssessmentStatusClassName - map assessment status to badge classes
export function getAssessmentStatusClassName(status: StudentAssessmentStatus) {
  if (status === 'FINISHED') {
    return 'rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-blue-500'
  }

  if (status === 'ANSWERING') {
    return 'rounded-md border-0 bg-yellow-500/10 px-2.5 py-0.5 text-yellow-500'
  }

  return 'rounded-md border-0 bg-rose-500/10 px-2.5 py-0.5 text-rose-500'
}

// getPresenceStatusLabel - format presence labels for badges
export function getPresenceStatusLabel(status: StudentPresenceStatus) {
  return status
}

// getAssessmentStatusLabel - format assessment labels for badges
export function getAssessmentStatusLabel(status: StudentAssessmentStatus) {
  if (status === 'NOT_STARTED') {
    return 'NOT STARTED'
  }

  return status
}

// getLatestAttemptStatusLabel - format latest attempt labels for the modal
export function getLatestAttemptStatusLabel(status: 'NOT_STARTED' | 'IN_PROGRESS' | 'PASSED' | 'FAILED') {
  if (status === 'NOT_STARTED') {
    return 'Not Started'
  }

  if (status === 'IN_PROGRESS') {
    return 'In Progress'
  }

  if (status === 'PASSED') {
    return 'Passed'
  }

  return 'Failed'
}
