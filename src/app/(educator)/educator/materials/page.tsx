import { requireServerAuthContext } from '@/lib/auth/server'

import { LearningMaterialsPageClient } from './components/learning-materials-page-client'

// LearningMaterialsPage - protect educator learning material management
export default async function LearningMaterialsPage() {
  await requireServerAuthContext('educator')

  return <LearningMaterialsPageClient />
}
