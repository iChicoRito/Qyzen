import { requireServerAuthContext } from '@/lib/auth/server'

import { RealtimeMonitoringPageClient } from './components/realtime-monitoring-page-client'

// RealtimeMonitoringPage - protect and render educator monitoring
export default async function RealtimeMonitoringPage() {
  // ==================== LOAD CONTEXT ====================
  await requireServerAuthContext('educator')

  // ==================== RENDER ====================
  return <RealtimeMonitoringPageClient />
}
