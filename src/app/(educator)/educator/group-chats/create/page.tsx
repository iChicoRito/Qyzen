import { requireServerAuthContext } from '@/lib/auth/server'
import { EducatorGroupChatsPageClient } from '../components/group-chats-page-client'

// CreateGroupChatPage - protect and render the educator group chat management screen
export default async function CreateGroupChatPage() {
  // ==================== LOAD CONTEXT ====================
  await requireServerAuthContext('educator')

  // ==================== RENDER ====================
  return <EducatorGroupChatsPageClient />
}
