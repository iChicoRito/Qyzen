'use client'

import type { SendGroupChatMessageInput } from '@/types/group-chat'

import {
  createEducatorGroupChatWithClient,
  deleteEducatorGroupChatWithClient,
  fetchEducatorManagedGroupChatsWithClient,
  fetchEducatorGroupChatSubjectOptionsWithClient,
  fetchGroupChatListWithClient,
  fetchGroupChatMessagesWithClient,
  markGroupChatAsReadWithClient,
  sendGroupChatMessageWithClient,
  type EducatorGroupChatSubjectOption,
  type CreateEducatorGroupChatInput,
} from './group-chat-shared'
import { createClient } from './client'

export type { EducatorGroupChatSubjectOption, CreateEducatorGroupChatInput }

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

// fetchEducatorGroupChatSubjectOptions - load educator subject options for manual chat creation
export async function fetchEducatorGroupChatSubjectOptions() {
  const supabase = createClient()
  return fetchEducatorGroupChatSubjectOptionsWithClient(supabase)
}

// fetchEducatorManagedGroupChats - load educator-owned group chats for the management page
export async function fetchEducatorManagedGroupChats() {
  const supabase = createClient()
  return fetchEducatorManagedGroupChatsWithClient(supabase)
}

// createEducatorGroupChat - create one educator-owned subject group chat manually
export async function createEducatorGroupChat(input: CreateEducatorGroupChatInput) {
  const supabase = createClient()
  return createEducatorGroupChatWithClient(supabase, input)
}

// deleteEducatorGroupChat - remove one educator-owned group chat manually
export async function deleteEducatorGroupChat(groupChatId: number) {
  const supabase = createClient()
  return deleteEducatorGroupChatWithClient(supabase, groupChatId)
}
