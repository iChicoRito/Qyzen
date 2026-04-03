export type NotificationEventType =
  | 'module_created'
  | 'module_updated'
  | 'module_deleted'
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
  moduleCode?: string
  subjectName?: string
  sectionName?: string
  studentName?: string
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
  moduleId: number | null
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
  moduleId?: number | null
  subjectId?: number | null
  sectionId?: number | null
  metadata?: NotificationMetadata | null
}
