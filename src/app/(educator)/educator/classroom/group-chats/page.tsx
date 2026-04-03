import { redirect } from 'next/navigation'

// EducatorClassroomGroupChatsRedirectPage - redirect old classroom chat route to the new educator chat route
export default async function EducatorGroupChatsPage() {
  // ==================== REDIRECT ====================
  redirect('/educator/group-chats')
}
