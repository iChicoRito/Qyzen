'use client'

import type { NotificationInsertInput } from '@/types/notification'

import {
  fetchActiveStudentRecipientIdsWithClient,
  fetchRecentNotificationsWithClient,
  fetchUnreadNotificationCountWithClient,
  insertNotificationsWithClient,
  markNotificationAsReadWithClient,
  markAllNotificationsAsReadWithClient,
} from './notification-shared'
import { createClient } from './client'

// fetchRecentNotifications - load the newest notifications for one user
export async function fetchRecentNotifications(recipientUserId: number, limit = 10) {
  const supabase = createClient()
  return fetchRecentNotificationsWithClient(supabase, recipientUserId, limit)
}

// fetchUnreadNotificationCount - count unread rows for one user
export async function fetchUnreadNotificationCount(recipientUserId: number) {
  const supabase = createClient()
  return fetchUnreadNotificationCountWithClient(supabase, recipientUserId)
}

// markAllNotificationsAsRead - mark unread rows as read for one user
export async function markAllNotificationsAsRead(recipientUserId: number) {
  const supabase = createClient()
  return markAllNotificationsAsReadWithClient(supabase, recipientUserId)
}

// markNotificationAsRead - mark one unread row as read for one user
export async function markNotificationAsRead(recipientUserId: number, notificationId: number) {
  const supabase = createClient()
  return markNotificationAsReadWithClient(supabase, recipientUserId, notificationId)
}

// fetchActiveStudentRecipientIds - load active student recipients for one educator subject
export async function fetchActiveStudentRecipientIds(educatorId: number, subjectId: number) {
  const supabase = createClient()
  return fetchActiveStudentRecipientIdsWithClient(supabase, educatorId, subjectId)
}

// insertNotifications - save one or many notification rows from the browser client
export async function insertNotifications(inputs: NotificationInsertInput[]) {
  const supabase = createClient()
  return insertNotificationsWithClient(supabase, inputs)
}
