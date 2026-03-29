import { requireServerAuthContext } from '@/lib/auth/server'

import { EnrollmentPageClient } from './components/enrollment-page-client'

// EnrollmentPage - protect educator enrollment module
export default async function EnrollmentPage() {
  // ==================== LOAD CONTEXT ====================
  await requireServerAuthContext('educator')

  // ==================== RENDER ====================
  return <EnrollmentPageClient />
}
