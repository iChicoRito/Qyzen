import type { SupabaseClient } from '@supabase/supabase-js'

import type {
  NotificationInsertInput,
  NotificationMetadata,
  NotificationRecord,
} from '@/types/notification'

interface NotificationRow {
  id: number
  recipient_user_id: number
  actor_user_id: number
  event_type: NotificationRecord['eventType']
  title: string
  message: string
  link_path: string | null
  module_id: number | null
  subject_id: number | null
  section_id: number | null
  metadata: unknown
  is_read: boolean
  read_at: string | null
  created_at: string
  updated_at: string
}

interface EnrollmentRecipientRow {
  student_id: number
}

interface SupabaseErrorResponse {
  message?: string
}

// getSupabaseErrorMessage - normalize Supabase errors
function getSupabaseErrorMessage(error: SupabaseErrorResponse | null, fallbackMessage: string) {
  return error?.message || fallbackMessage
}

// normalizeNotificationMetadata - keep metadata payloads safely shaped
function normalizeNotificationMetadata(metadata: unknown): NotificationMetadata | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null
  }

  return metadata as NotificationMetadata
}

// mapNotificationRow - convert db rows into app records
function mapNotificationRow(row: NotificationRow): NotificationRecord {
  return {
    id: row.id,
    recipientUserId: row.recipient_user_id,
    actorUserId: row.actor_user_id,
    eventType: row.event_type,
    title: row.title,
    message: row.message,
    linkPath: row.link_path,
    moduleId: row.module_id,
    subjectId: row.subject_id,
    sectionId: row.section_id,
    metadata: normalizeNotificationMetadata(row.metadata),
    isRead: row.is_read,
    readAt: row.read_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// fetchRecentNotificationsWithClient - load the newest notification rows for one user
export async function fetchRecentNotificationsWithClient(
  supabase: SupabaseClient,
  recipientUserId: number,
  limit = 10
) {
  const { data, error } = await supabase
    .from('tbl_notifications')
    .select(
      'id,recipient_user_id,actor_user_id,event_type,title,message,link_path,module_id,subject_id,section_id,metadata,is_read,read_at,created_at,updated_at'
    )
    .eq('recipient_user_id', recipientUserId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load notifications.'))
  }

  return ((data || []) as NotificationRow[]).map(mapNotificationRow)
}

// fetchUnreadNotificationCountWithClient - count unread notifications for one user
export async function fetchUnreadNotificationCountWithClient(
  supabase: SupabaseClient,
  recipientUserId: number
) {
  const { count, error } = await supabase
    .from('tbl_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_user_id', recipientUserId)
    .eq('is_read', false)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to count notifications.'))
  }

  return count || 0
}

// markAllNotificationsAsReadWithClient - mark one user's unread rows as read
export async function markAllNotificationsAsReadWithClient(
  supabase: SupabaseClient,
  recipientUserId: number
) {
  const readAt = new Date().toISOString()
  const { error } = await supabase
    .from('tbl_notifications')
    .update({
      is_read: true,
      read_at: readAt,
      updated_at: readAt,
    })
    .eq('recipient_user_id', recipientUserId)
    .eq('is_read', false)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to mark notifications as read.'))
  }
}

// markNotificationAsReadWithClient - mark one notification row as read for one user
export async function markNotificationAsReadWithClient(
  supabase: SupabaseClient,
  recipientUserId: number,
  notificationId: number
) {
  const readAt = new Date().toISOString()
  const { error } = await supabase
    .from('tbl_notifications')
    .update({
      is_read: true,
      read_at: readAt,
      updated_at: readAt,
    })
    .eq('id', notificationId)
    .eq('recipient_user_id', recipientUserId)
    .eq('is_read', false)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to mark notification as read.'))
  }
}

// fetchActiveStudentRecipientIdsWithClient - load active enrolled students for one subject
export async function fetchActiveStudentRecipientIdsWithClient(
  supabase: SupabaseClient,
  educatorId: number,
  subjectId: number
) {
  const { data, error } = await supabase
    .from('tbl_enrolled')
    .select('student_id')
    .eq('educator_id', educatorId)
    .eq('subject_id', subjectId)
    .eq('is_active', true)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load notification recipients.'))
  }

  return Array.from(
    new Set(((data || []) as EnrollmentRecipientRow[]).map((row) => row.student_id))
  )
}

// insertNotificationsWithClient - save one or many notification rows
export async function insertNotificationsWithClient(
  supabase: SupabaseClient,
  inputs: NotificationInsertInput[]
) {
  if (inputs.length === 0) {
    return
  }

  const createdAt = new Date().toISOString()
  const rowsToInsert = inputs.map((input) => ({
    recipient_user_id: input.recipientUserId,
    actor_user_id: input.actorUserId,
    event_type: input.eventType,
    title: input.title,
    message: input.message,
    link_path: input.linkPath,
    module_id: input.moduleId ?? null,
    subject_id: input.subjectId ?? null,
    section_id: input.sectionId ?? null,
    metadata: input.metadata ?? null,
    is_read: false,
    read_at: null,
    created_at: createdAt,
    updated_at: createdAt,
  }))

  const { error } = await supabase.from('tbl_notifications').insert(rowsToInsert)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to save notifications.'))
  }
}
