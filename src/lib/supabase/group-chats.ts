'use client'

import type { SendGroupChatMessageInput } from '@/types/group-chat'

import {
  ensureGroupChatsForSubjectIdsWithClient,
  fetchGroupChatListWithClient,
  fetchGroupChatMessagesWithClient,
  markGroupChatAsReadWithClient,
  sendGroupChatMessageWithClient,
} from './group-chat-shared'
import { createClient } from './client'

// fetchGroupChatList - load current user chat rooms
export async function fetchGroupChatList() {
  const supabase = createClient()
  return fetchGroupChatListWithClient(supabase)
}

// fetchGroupChatMessages - load one current user chat thread
export async function fetchGroupChatMessages(groupChatId: number) {
  const supabase = createClient()
  return fetchGroupChatMessagesWithClient(supabase, groupChatId)
}

// sendGroupChatMessage - insert one message for the current user
export async function sendGroupChatMessage(input: SendGroupChatMessageInput) {
  const supabase = createClient()
  return sendGroupChatMessageWithClient(supabase, input)
}

// markGroupChatAsRead - update one chat read marker
export async function markGroupChatAsRead(groupChatId: number, userId: number) {
  const supabase = createClient()
  return markGroupChatAsReadWithClient(supabase, groupChatId, userId)
}

// ensureGroupChatsForSubjectIds - create missing chat rows for active educator subjects
export async function ensureGroupChatsForSubjectIds(educatorId: number, subjectIds: number[]) {
  const supabase = createClient()
  return ensureGroupChatsForSubjectIdsWithClient(supabase, educatorId, subjectIds)
}
