import { z } from 'zod'

// studentMonitoringStatusSchema - validate the live student status values
export const studentMonitoringStatusSchema = z.enum(['OFFLINE', 'ONLINE', 'ANSWERING', 'FINISHED'])

// studentPresenceStatusSchema - validate the live presence values
export const studentPresenceStatusSchema = z.enum(['OFFLINE', 'ONLINE'])

// studentAssessmentStatusSchema - validate the assessment progress values
export const studentAssessmentStatusSchema = z.enum(['NOT_STARTED', 'ANSWERING', 'FINISHED'])

// latestAttemptStatusSchema - validate the latest attempt state
export const latestAttemptStatusSchema = z.enum(['NOT_STARTED', 'IN_PROGRESS', 'PASSED', 'FAILED'])

// educatorRealtimeMonitoringStudentSchema - validate one monitored student row
export const educatorRealtimeMonitoringStudentSchema = z.object({
  studentId: z.number(),
  studentUserId: z.string(),
  studentName: z.string(),
  status: studentMonitoringStatusSchema,
  presenceStatus: studentPresenceStatusSchema,
  assessmentStatus: studentAssessmentStatusSchema,
  lastSeenAt: z.string().nullable(),
  currentPath: z.string().nullable(),
  latestAttemptStatus: latestAttemptStatusSchema,
  latestScoreId: z.number().nullable(),
  latestScore: z.number().nullable(),
  latestTotalQuestions: z.number().nullable(),
  latestTakenAt: z.string().nullable(),
  latestSubmittedAt: z.string().nullable(),
  warningAttempts: z.number(),
})

// educatorRealtimeMonitoringRowSchema - validate one module monitoring row
export const educatorRealtimeMonitoringRowSchema = z.object({
  moduleRowId: z.number(),
  moduleId: z.string(),
  moduleCode: z.string(),
  subjectId: z.number(),
  subjectName: z.string(),
  sectionId: z.number(),
  sectionName: z.string(),
  termName: z.string(),
  timeLimitMinutes: z.number(),
  questionCount: z.number(),
  enrolledCount: z.number(),
  offlineCount: z.number(),
  onlineCount: z.number(),
  answeringCount: z.number(),
  finishedCount: z.number(),
  rowStatus: studentMonitoringStatusSchema,
  rowPresenceStatus: studentPresenceStatusSchema,
  rowAssessmentStatus: studentAssessmentStatusSchema,
  students: z.array(educatorRealtimeMonitoringStudentSchema),
})

export type StudentMonitoringStatus = z.infer<typeof studentMonitoringStatusSchema>
export type StudentPresenceStatus = z.infer<typeof studentPresenceStatusSchema>
export type StudentAssessmentStatus = z.infer<typeof studentAssessmentStatusSchema>
export type EducatorRealtimeMonitoringStudent = z.infer<typeof educatorRealtimeMonitoringStudentSchema>
export type EducatorRealtimeMonitoringRow = z.infer<typeof educatorRealtimeMonitoringRowSchema>
