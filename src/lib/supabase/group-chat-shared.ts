import type { SupabaseClient } from '@supabase/supabase-js'

import type {
  EducatorManagedGroupChat,
  GroupChatListItem,
  GroupChatMessage,
  GroupChatSenderRole,
  SendGroupChatMessageInput,
} from '@/types/group-chat'
import { STUDENT_PRESENCE_FRESHNESS_MS } from '@/lib/supabase/student-presence'

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
  is_seen_by_other_participant: boolean
}

interface GroupChatReadRow {
  user_id: number
  last_read_at: string
}

interface SubjectGroupChatRow {
  id: number
  educator_id: number
  subject_code?: string
  subject_name?: string
  is_active?: boolean
  sections_id: number
  section?: {
    id: number
    section_name: string
    is_active: boolean
  } | Array<{
    id: number
    section_name: string
    is_active: boolean
  }> | null
}

interface ExistingGroupChatRow {
  id: number
  subject_id: number
  section_id: number
}

interface UserLookupRow {
  id: number
}

interface GroupChatSectionRow {
  id: number
  section_name: string
  is_active: boolean
}

interface ManagedGroupChatRow {
  id: number
  educator_id: number
  subject_id: number
  section_id: number
  created_at: string
  subject: {
    subject_name: string
  } | Array<{
    subject_name: string
  }> | null
  section: {
    section_name: string
  } | Array<{
    section_name: string
  }> | null
}

interface EnrollmentCountRow {
  subject_id: number
  student_id: number
}

interface PresenceRow {
  student_id: number
  last_seen_at: string
}

export interface EducatorGroupChatSubjectOption {
  id: number
  subjectCode: string
  subjectName: string
  status: 'active' | 'inactive'
  section: {
    id: number
    name: string
    status: 'active' | 'inactive'
  }
}

export interface CreateEducatorGroupChatInput {
  subjectId: number
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

// mapGroupChatSubjectOption - convert one educator subject row into a creator option
function mapGroupChatSubjectOption(row: SubjectGroupChatRow): EducatorGroupChatSubjectOption | null {
  const section = Array.isArray(row.section) ? row.section[0] : row.section

  if (!section || !row.subject_code || !row.subject_name) {
    return null
  }

  return {
    id: row.id,
    subjectCode: row.subject_code,
    subjectName: row.subject_name,
    status: row.is_active ? 'active' : 'inactive',
    section: {
      id: section.id,
      name: section.section_name,
      status: section.is_active ? 'active' : 'inactive',
    },
  }
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
    isSeenByOtherParticipant: row.is_seen_by_other_participant,
  }
}

// applySeenStateToMessages - derive one seen flag from current read rows
function applySeenStateToMessages(messages: GroupChatMessage[], reads: GroupChatReadRow[]) {
  return messages.map((message) => {
    const messageCreatedAt = new Date(message.createdAt).getTime()
    const isSeenByOtherParticipant = reads.some((read) => {
      if (read.user_id === message.senderUserId) {
        return false
      }

      const lastReadAt = new Date(read.last_read_at).getTime()
      return !Number.isNaN(lastReadAt) && lastReadAt >= messageCreatedAt
    })

    return {
      ...message,
      isSeenByOtherParticipant,
    }
  })
}

// mapEducatorManagedGroupChat - convert one educator-owned row and summary counts into a management row
function mapEducatorManagedGroupChat(
  row: ManagedGroupChatRow,
  studentCount: number,
  onlineStudentCount: number
): EducatorManagedGroupChat | null {
  const subject = Array.isArray(row.subject) ? row.subject[0] : row.subject
  const section = Array.isArray(row.section) ? row.section[0] : row.section

  if (!subject || !section) {
    return null
  }

  return {
    id: row.id,
    subjectId: row.subject_id,
    sectionId: row.section_id,
    educatorId: row.educator_id,
    subjectName: subject.subject_name,
    sectionName: section.section_name,
    studentCount,
    onlineStudentCount,
    createdAt: row.created_at,
  }
}

// buildSubjectParticipantSummaryWithClient - compute classroom member counts for one subject
async function buildSubjectParticipantSummaryWithClient(
  supabase: SupabaseClient,
  educatorId: number,
  subjectId: number
) {
  const { data: enrollmentData, error: enrollmentError } = await supabase
    .from('tbl_enrolled')
    .select('subject_id,student_id')
    .eq('educator_id', educatorId)
    .eq('subject_id', subjectId)
    .eq('is_active', true)

  if (enrollmentError) {
    throw new Error(getSupabaseErrorMessage(enrollmentError, 'Failed to load group chat member counts.'))
  }

  const enrollmentRows = (enrollmentData || []) as EnrollmentCountRow[]
  const studentIds = Array.from(new Set(enrollmentRows.map((row) => row.student_id)))
  const onlineCutoff = Date.now() - STUDENT_PRESENCE_FRESHNESS_MS
  const onlineStudentIds = new Set<number>()

  if (studentIds.length > 0) {
    const { data: presenceData, error: presenceError } = await supabase
      .from('tbl_student_presence')
      .select('student_id,last_seen_at')
      .in('student_id', studentIds)

    if (presenceError) {
      throw new Error(getSupabaseErrorMessage(presenceError, 'Failed to load group chat online counts.'))
    }

    for (const row of (presenceData || []) as PresenceRow[]) {
      const lastSeenAt = new Date(row.last_seen_at).getTime()

      if (!Number.isNaN(lastSeenAt) && lastSeenAt >= onlineCutoff) {
        onlineStudentIds.add(row.student_id)
      }
    }
  }

  return {
    studentCount: studentIds.length,
    onlineStudentCount: studentIds.filter((studentId) => onlineStudentIds.has(studentId)).length,
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
  const [{ data: messageData, error: messageError }, { data: readData, error: readError }] = await Promise.all([
    supabase.rpc('get_group_chat_messages', {
      target_group_chat_id: groupChatId,
    }),
    supabase
      .from('tbl_group_chat_reads')
      .select('user_id,last_read_at')
      .eq('group_chat_id', groupChatId),
  ])

  if (messageError) {
    throw new Error(getSupabaseErrorMessage(messageError, 'Failed to load group chat messages.'))
  }

  if (readError) {
    throw new Error(getSupabaseErrorMessage(readError, 'Failed to load the group chat read state.'))
  }

  const mappedMessages = ((messageData || []) as GroupChatMessageRow[]).map(mapGroupChatMessage)
  return applySeenStateToMessages(mappedMessages, (readData || []) as GroupChatReadRow[])
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

// getCurrentEducatorIdWithClient - resolve the current educator profile id
async function getCurrentEducatorIdWithClient(supabase: SupabaseClient) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user?.email) {
    throw new Error('Authenticated educator was not found.')
  }

  const { data, error } = await supabase
    .from('tbl_users')
    .select('id')
    .eq('email', user.email)
    .is('deleted_at', null)
    .limit(1)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load educator profile.'))
  }

  const rows = (data || []) as UserLookupRow[]

  if (!rows[0]) {
    throw new Error('Educator profile was not found.')
  }

  return rows[0].id
}

// fetchEducatorGroupChatSubjectOptionsWithClient - load owned subject and section options for manual chat creation
export async function fetchEducatorGroupChatSubjectOptionsWithClient(supabase: SupabaseClient) {
  const educatorId = await getCurrentEducatorIdWithClient(supabase)
  const { data, error } = await supabase
    .from('tbl_subjects')
    .select('id,educator_id,subject_code,subject_name,is_active,sections_id,section:sections_id(id,section_name,is_active)')
    .eq('educator_id', educatorId)
    .order('subject_name', { ascending: true })

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load educator group chat subjects.'))
  }

  return ((data || []) as SubjectGroupChatRow[])
    .map(mapGroupChatSubjectOption)
    .filter((option): option is EducatorGroupChatSubjectOption => Boolean(option))
}

// fetchEducatorManagedGroupChatsWithClient - load educator-owned group chats for the management table
export async function fetchEducatorManagedGroupChatsWithClient(supabase: SupabaseClient) {
  const educatorId = await getCurrentEducatorIdWithClient(supabase)
  const { data, error } = await supabase
    .from('tbl_group_chats')
    .select(
      'id,educator_id,subject_id,section_id,created_at,subject:subject_id(subject_name),section:section_id(section_name)'
    )
    .eq('educator_id', educatorId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load educator group chats.'))
  }

  const chatRows = (data || []) as ManagedGroupChatRow[]
  const subjectIds = Array.from(new Set(chatRows.map((row) => row.subject_id)))

  if (chatRows.length === 0 || subjectIds.length === 0) {
    return [] as EducatorManagedGroupChat[]
  }

  const { data: enrollmentData, error: enrollmentError } = await supabase
    .from('tbl_enrolled')
    .select('subject_id,student_id')
    .eq('educator_id', educatorId)
    .eq('is_active', true)
    .in('subject_id', subjectIds)

  if (enrollmentError) {
    throw new Error(getSupabaseErrorMessage(enrollmentError, 'Failed to load group chat member counts.'))
  }

  const enrollmentRows = (enrollmentData || []) as EnrollmentCountRow[]
  const studentIds = Array.from(new Set(enrollmentRows.map((row) => row.student_id)))
  const onlineCutoff = Date.now() - STUDENT_PRESENCE_FRESHNESS_MS
  const onlineStudentIds = new Set<number>()

  if (studentIds.length > 0) {
    const { data: presenceData, error: presenceError } = await supabase
      .from('tbl_student_presence')
      .select('student_id,last_seen_at')
      .in('student_id', studentIds)

    if (presenceError) {
      throw new Error(getSupabaseErrorMessage(presenceError, 'Failed to load group chat online counts.'))
    }

    for (const row of (presenceData || []) as PresenceRow[]) {
      const lastSeenAt = new Date(row.last_seen_at).getTime()

      if (!Number.isNaN(lastSeenAt) && lastSeenAt >= onlineCutoff) {
        onlineStudentIds.add(row.student_id)
      }
    }
  }

  const subjectStudentIdsMap = enrollmentRows.reduce<Map<number, Set<number>>>((map, row) => {
    const nextSet = map.get(row.subject_id) || new Set<number>()
    nextSet.add(row.student_id)
    map.set(row.subject_id, nextSet)
    return map
  }, new Map<number, Set<number>>())

  return chatRows
    .map((row) => {
      const subjectStudentIds = subjectStudentIdsMap.get(row.subject_id) || new Set<number>()
      const onlineStudentCount = Array.from(subjectStudentIds).filter((studentId) =>
        onlineStudentIds.has(studentId)
      ).length

      return mapEducatorManagedGroupChat(row, subjectStudentIds.size, onlineStudentCount)
    })
    .filter((row): row is EducatorManagedGroupChat => Boolean(row))
}

// createEducatorGroupChatWithClient - insert one educator-owned group chat row
export async function createEducatorGroupChatWithClient(
  supabase: SupabaseClient,
  input: CreateEducatorGroupChatInput
) {
  const educatorId = await getCurrentEducatorIdWithClient(supabase)

  const { data: subjectData, error: subjectError } = await supabase
    .from('tbl_subjects')
    .select('id,educator_id,subject_code,subject_name,is_active,sections_id,section:sections_id(id,section_name,is_active)')
    .eq('educator_id', educatorId)
    .eq('id', input.subjectId)
    .limit(1)

  if (subjectError) {
    throw new Error(getSupabaseErrorMessage(subjectError, 'Failed to load the selected subject.'))
  }

  const subjectRows = (subjectData || []) as SubjectGroupChatRow[]

  if (!subjectRows[0]) {
    throw new Error('The selected subject was not found.')
  }

  const subjectRow = subjectRows[0]

  const { data: existingData, error: existingError } = await supabase
    .from('tbl_group_chats')
    .select('id,subject_id,section_id')
    .eq('educator_id', educatorId)
    .eq('subject_id', subjectRow.id)
    .eq('section_id', subjectRow.sections_id)
    .limit(1)

  if (existingError) {
    throw new Error(getSupabaseErrorMessage(existingError, 'Failed to validate the existing group chat.'))
  }

  const existingRows = (existingData || []) as ExistingGroupChatRow[]

  if (existingRows[0]) {
    throw new Error('A group chat already exists for the selected subject and section.')
  }

  const timestamp = new Date().toISOString()
  const { data: insertData, error: insertError } = await supabase
    .from('tbl_group_chats')
    .insert({
      educator_id: subjectRow.educator_id,
      subject_id: subjectRow.id,
      section_id: subjectRow.sections_id,
      created_at: timestamp,
      updated_at: timestamp,
    })
    .select(
      'id,educator_id,subject_id,section_id,created_at,subject:subject_id(subject_name),section:section_id(section_name)'
    )
    .single()

  if (insertError) {
    throw new Error(getSupabaseErrorMessage(insertError, 'Failed to create the subject group chat.'))
  }

  const createdRow = mapEducatorManagedGroupChat(insertData as ManagedGroupChatRow, 0, 0)

  if (!createdRow) {
    throw new Error('Created group chat details were not found.')
  }

  const participantSummary = await buildSubjectParticipantSummaryWithClient(
    supabase,
    educatorId,
    subjectRow.id
  )

  return {
    ...createdRow,
    studentCount: participantSummary.studentCount,
    onlineStudentCount: participantSummary.onlineStudentCount,
  }
}

// deleteEducatorGroupChatWithClient - delete one educator-owned group chat row
export async function deleteEducatorGroupChatWithClient(
  supabase: SupabaseClient,
  groupChatId: number
) {
  const educatorId = await getCurrentEducatorIdWithClient(supabase)
  const { error } = await supabase
    .from('tbl_group_chats')
    .delete()
    .eq('id', groupChatId)
    .eq('educator_id', educatorId)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to delete the group chat.'))
  }
}
