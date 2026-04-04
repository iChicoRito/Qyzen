export type GroupChatSenderRole = 'student' | 'educator'

export interface GroupChatParticipantSummary {
  studentCount: number
  onlineStudentCount: number
}

export interface GroupChatListItem {
  id: number
  subjectId: number
  sectionId: number
  educatorId: number
  subjectName: string
  sectionName: string
  studentCount: number
  onlineStudentCount: number
  lastMessagePreview: string | null
  lastMessageAt: string | null
  lastMessageSenderUserId: number | null
  lastMessageSenderDisplayName: string | null
  unreadCount: number
  participantSummary: GroupChatParticipantSummary
}

export interface GroupChatMessage {
  id: number
  groupChatId: number
  senderUserId: number
  senderDisplayName: string
  senderRole: GroupChatSenderRole
  content: string
  createdAt: string
  isSeenByOtherParticipant: boolean
}

export interface SendGroupChatMessageInput {
  groupChatId: number
  senderUserId: number
  content: string
}

export interface EducatorManagedGroupChat {
  id: number
  subjectId: number
  sectionId: number
  educatorId: number
  subjectName: string
  sectionName: string
  studentCount: number
  onlineStudentCount: number
  createdAt: string
}
