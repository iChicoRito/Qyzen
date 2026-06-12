export type NotificationEventType =
  | 'assessment_created'
  | 'assessment_updated'
  | 'assessment_deleted'
  | 'learning_material_uploaded'
  | 'learning_material_deleted'
  | 'quiz_created'
  | 'quiz_uploaded'
  | 'quiz_updated'
  | 'quiz_deleted'
  | 'enrollment_created'
  | 'enrollment_updated'
  | 'enrollment_deleted'
  | 'retake_updated'
  | 'quiz_submitted'

export interface NotificationMetadata {
  assessmentCode?: string
  subjectName?: string
  sectionName?: string
  studentName?: string
  fileName?: string
  fileCount?: number
  questionCount?: number
  retakeCount?: number
  enrollmentStatus?: 'active' | 'inactive'
}

export interface NotificationRecord {
  id: number
  recipientUserId: number
  actorUserId: number
  eventType: NotificationEventType
  title: string
  message: string
  linkPath: string | null
  assessmentId: number | null
  subjectId: number | null
  sectionId: number | null
  metadata: NotificationMetadata | null
  isRead: boolean
  readAt: string | null
  createdAt: string
  updatedAt: string
}

export interface NotificationInsertInput {
  recipientUserId: number
  actorUserId: number
  eventType: NotificationEventType
  title: string
  message: string
  linkPath: string | null
  assessmentId?: number | null
  subjectId?: number | null
  sectionId?: number | null
  metadata?: NotificationMetadata | null
}

