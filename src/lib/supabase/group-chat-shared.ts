import type { SupabaseClient } from '@supabase/supabase-js'

import type {
  GroupChatListItem,
  GroupChatMessage,
  GroupChatSenderRole,
  SendGroupChatMessageInput,
} from '@/types/group-chat'

interface GroupChatListRow {
  group_chat_id: number
  subject_id: number
  section_id: number
  educator_id: number
  subject_name: string
  section_name: string
  student_count: number
  online_student_count: number
  last_message_preview: string | null
  last_message_at: string | null
  last_message_sender_user_id: number | null
  last_message_sender_display_name: string | null
  unread_count: number
}

interface GroupChatMessageRow {
  message_id: number
  group_chat_id: number
  sender_user_id: number
  sender_display_name: string
  sender_role: string
  content: string
  created_at: string
}

interface SubjectGroupChatRow {
  id: number
  educator_id: number
  sections_id: number
}

interface ExistingGroupChatRow {
  subject_id: number
  section_id: number
}

interface SupabaseErrorResponse {
  message?: string
}

// getSupabaseErrorMessage - normalize Supabase errors
function getSupabaseErrorMessage(error: SupabaseErrorResponse | null, fallbackMessage: string) {
  return error?.message || fallbackMessage
}

// normalizeSenderRole - keep sender roles inside the app role union
function normalizeSenderRole(role: string): GroupChatSenderRole {
  return role === 'educator' ? 'educator' : 'student'
}

// mapGroupChatListItem - convert rpc rows into chat list items
function mapGroupChatListItem(row: GroupChatListRow): GroupChatListItem {
  return {
    id: row.group_chat_id,
    subjectId: row.subject_id,
    sectionId: row.section_id,
    educatorId: row.educator_id,
    subjectName: row.subject_name,
    sectionName: row.section_name,
    studentCount: row.student_count,
    onlineStudentCount: row.online_student_count,
    lastMessagePreview: row.last_message_preview,
    lastMessageAt: row.last_message_at,
    lastMessageSenderUserId: row.last_message_sender_user_id,
    lastMessageSenderDisplayName: row.last_message_sender_display_name,
    unreadCount: row.unread_count,
    participantSummary: {
      studentCount: row.student_count,
      onlineStudentCount: row.online_student_count,
    },
  }
}

// mapGroupChatMessage - convert rpc rows into thread messages
function mapGroupChatMessage(row: GroupChatMessageRow): GroupChatMessage {
  return {
    id: row.message_id,
    groupChatId: row.group_chat_id,
    senderUserId: row.sender_user_id,
    senderDisplayName: row.sender_display_name,
    senderRole: normalizeSenderRole(row.sender_role),
    content: row.content,
    createdAt: row.created_at,
  }
}

// fetchGroupChatListWithClient - load visible chat rooms for the current user
export async function fetchGroupChatListWithClient(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc('get_group_chat_list')

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load group chats.'))
  }

  return ((data || []) as GroupChatListRow[]).map(mapGroupChatListItem)
}

// fetchGroupChatMessagesWithClient - load one chat thread for the current user
export async function fetchGroupChatMessagesWithClient(
  supabase: SupabaseClient,
  groupChatId: number
) {
  const { data, error } = await supabase.rpc('get_group_chat_messages', {
    target_group_chat_id: groupChatId,
  })

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load group chat messages.'))
  }

  return ((data || []) as GroupChatMessageRow[]).map(mapGroupChatMessage)
}

// sendGroupChatMessageWithClient - save one text message into a group chat
export async function sendGroupChatMessageWithClient(
  supabase: SupabaseClient,
  input: SendGroupChatMessageInput
) {
  const content = input.content.trim()

  if (!content) {
    throw new Error('Message content is required.')
  }

  const timestamp = new Date().toISOString()
  const { error } = await supabase.from('tbl_group_chat_messages').insert({
    group_chat_id: input.groupChatId,
    sender_user_id: input.senderUserId,
    content,
    created_at: timestamp,
    updated_at: timestamp,
  })

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to send the group chat message.'))
  }
}

// markGroupChatAsReadWithClient - upsert the latest read timestamp for one chat member
export async function markGroupChatAsReadWithClient(
  supabase: SupabaseClient,
  groupChatId: number,
  userId: number
) {
  const timestamp = new Date().toISOString()
  const { error } = await supabase.from('tbl_group_chat_reads').upsert(
    {
      group_chat_id: groupChatId,
      user_id: userId,
      last_read_at: timestamp,
      updated_at: timestamp,
    },
    {
      onConflict: 'group_chat_id,user_id',
    }
  )

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to update the group chat read state.'))
  }
}

// ensureGroupChatsForSubjectIdsWithClient - create missing chat rows for the educator subjects
export async function ensureGroupChatsForSubjectIdsWithClient(
  supabase: SupabaseClient,
  educatorId: number,
  subjectIds: number[]
) {
  const uniqueSubjectIds = Array.from(new Set(subjectIds))

  if (uniqueSubjectIds.length === 0) {
    return
  }

  const { data: subjectData, error: subjectError } = await supabase
    .from('tbl_subjects')
    .select('id,educator_id,sections_id')
    .eq('educator_id', educatorId)
    .in('id', uniqueSubjectIds)

  if (subjectError) {
    throw new Error(getSupabaseErrorMessage(subjectError, 'Failed to load group chat subjects.'))
  }

  const subjectRows = (subjectData || []) as SubjectGroupChatRow[]

  if (subjectRows.length === 0) {
    return
  }

  const { data: existingData, error: existingError } = await supabase
    .from('tbl_group_chats')
    .select('subject_id,section_id')
    .eq('educator_id', educatorId)
    .in(
      'subject_id',
      subjectRows.map((row) => row.id)
    )

  if (existingError) {
    throw new Error(getSupabaseErrorMessage(existingError, 'Failed to load existing group chats.'))
  }

  const existingPairs = new Set(
    ((existingData || []) as ExistingGroupChatRow[]).map((row) => `${row.subject_id}:${row.section_id}`)
  )

  const timestamp = new Date().toISOString()
  const rowsToInsert = subjectRows
    .filter((row) => !existingPairs.has(`${row.id}:${row.sections_id}`))
    .map((row) => ({
      educator_id: row.educator_id,
      subject_id: row.id,
      section_id: row.sections_id,
      created_at: timestamp,
      updated_at: timestamp,
    }))

  if (rowsToInsert.length === 0) {
    return
  }

  const { error: insertError } = await supabase.from('tbl_group_chats').insert(rowsToInsert)

  if (insertError) {
    throw new Error(getSupabaseErrorMessage(insertError, 'Failed to create the subject group chat.'))
  }
}
