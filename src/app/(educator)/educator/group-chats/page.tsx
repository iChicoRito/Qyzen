import { GroupChatsPageClient } from '@/components/group-chats/group-chats-page-client'
import { requireServerAuthContext } from '@/lib/auth/server'

// EducatorGroupChatsPage - protect and render the educator live chat screen
export default async function EducatorGroupChatsPage() {
  // ==================== LOAD CONTEXT ====================
  const context = await requireServerAuthContext('educator')

  // ==================== RENDER ====================
  return <GroupChatsPageClient currentUserId={context.profile.id} role="educator" />
}
