import { redirect } from 'next/navigation'

import { getAssessmentPermissions } from '@/lib/auth/assessment-permissions'
import { requireServerAuthContext } from '@/lib/auth/server'
import { fetchPermissionStringsByUserId } from '@/lib/auth/server-permissions'

import { AssessmentsPageClient } from './components/assessments-page-client'

// AssessmentsPage - protect educator assessments by rbac
export default async function AssessmentsPage() {
  // ==================== LOAD CONTEXT ====================
  const context = await requireServerAuthContext('educator')
  const permissionStrings = await fetchPermissionStringsByUserId(context.profile.id)
  const permissions = getAssessmentPermissions(permissionStrings)

  if (!permissions.canView) {
    redirect('/errors/forbidden')
  }

  // ==================== RENDER ====================
  return <AssessmentsPageClient permissions={permissions} />
}

