import { redirect } from 'next/navigation'

import { requireServerAuthContext } from '@/lib/auth/server'

// EducatorGroupChatMessagesPage - redirect the legacy educator messages route to the live chat screen
export default async function EducatorGroupChatMessagesPage() {
  // ==================== LOAD CONTEXT ====================
  await requireServerAuthContext('educator')

  // ==================== REDIRECT ====================
  redirect('/educator/group-chats')
}
