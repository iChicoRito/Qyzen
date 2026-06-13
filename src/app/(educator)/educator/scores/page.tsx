import { requireServerAuthContext } from '@/lib/auth/server'

import { ScoresPageClient } from './components/scores-page-client'

// ScoresPage - protect educator score monitoring
export default async function ScoresPage() {
  // ==================== LOAD CONTEXT ====================
  const context = await requireServerAuthContext('educator')
  const educatorName = `${context.profile.givenName} ${context.profile.surname}`.trim()

  // ==================== RENDER ====================
  return <ScoresPageClient educatorName={educatorName} />
}
