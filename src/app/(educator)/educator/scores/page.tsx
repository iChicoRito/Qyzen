import { requireServerAuthContext } from '@/lib/auth/server'

import { ScoresPageClient } from './components/scores-page-client'

// ScoresPage - protect educator score monitoring
export default async function ScoresPage() {
  // ==================== LOAD CONTEXT ====================
  await requireServerAuthContext('educator')

  // ==================== RENDER ====================
  return <ScoresPageClient />
}
