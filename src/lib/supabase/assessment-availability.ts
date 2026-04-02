export type AssessmentAvailabilityStatus = 'upcoming' | 'available' | 'expired' | 'invalid'

interface AssessmentAvailabilityInput {
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  hasExpiredOverride?: boolean
  now?: Date
}

export interface AssessmentAvailabilityResult {
  availabilityStatus: AssessmentAvailabilityStatus
  isScheduleOpen: boolean
  isScheduleLocked: boolean
  isExpiredOverrideActive: boolean
  availabilityMessage: string
}

// buildScheduleDateTime - combine date and time into one runtime date
function buildScheduleDateTime(date: string, time: string) {
  return new Date(`${date}T${time}`)
}

// getAssessmentAvailability - resolve current schedule access state
export function getAssessmentAvailability({
  startDate,
  endDate,
  startTime,
  endTime,
  hasExpiredOverride = false,
  now = new Date(),
}: AssessmentAvailabilityInput): AssessmentAvailabilityResult {
  const startDateTime = buildScheduleDateTime(startDate, startTime)
  const endDateTime = buildScheduleDateTime(endDate, endTime)

  if (Number.isNaN(startDateTime.getTime()) || Number.isNaN(endDateTime.getTime())) {
    return {
      availabilityStatus: 'invalid',
      isScheduleOpen: false,
      isScheduleLocked: true,
      isExpiredOverrideActive: false,
      availabilityMessage: 'This assessment schedule is not available right now.',
    }
  }

  if (now < startDateTime) {
    return {
      availabilityStatus: 'upcoming',
      isScheduleOpen: false,
      isScheduleLocked: true,
      isExpiredOverrideActive: false,
      availabilityMessage: 'This assessment is not available yet. Please wait for the scheduled start time.',
    }
  }

  if (now > endDateTime) {
    if (hasExpiredOverride) {
      return {
        availabilityStatus: 'available',
        isScheduleOpen: true,
        isScheduleLocked: false,
        isExpiredOverrideActive: true,
        availabilityMessage: 'This assessment was reopened by your educator after the original schedule expired.',
      }
    }

    return {
      availabilityStatus: 'expired',
      isScheduleOpen: false,
      isScheduleLocked: true,
      isExpiredOverrideActive: false,
      availabilityMessage: 'This assessment is already locked because the scheduled end time has passed.',
    }
  }

  return {
    availabilityStatus: 'available',
    isScheduleOpen: true,
    isScheduleLocked: false,
    isExpiredOverrideActive: false,
    availabilityMessage: 'This assessment is available right now.',
  }
}
