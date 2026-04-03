import { GroupChatsPageClient } from '@/components/group-chats/group-chats-page-client'
import { requireServerAuthContext } from '@/lib/auth/server'

// StudentGroupChatsPage - protect and render the student group chat screen
export default async function StudentGroupChatsPage() {
  // ==================== LOAD CONTEXT ====================
  const context = await requireServerAuthContext('student')

  // ==================== RENDER ====================
  return <GroupChatsPageClient currentUserId={context.profile.id} role="student" />
}
