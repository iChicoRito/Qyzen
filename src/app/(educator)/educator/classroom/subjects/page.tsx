import { redirect } from 'next/navigation'

import { fetchPermissionStringsByUserId } from '@/lib/auth/server-permissions'
import { requireServerAuthContext } from '@/lib/auth/server'
import { getSubjectPermissions } from '@/lib/auth/subject-permissions'

import { SubjectsPageClient } from './components/subjects-page-client'

// SubjectsPage - protect educator subject module by rbac
export default async function SubjectsPage() {
  // ==================== LOAD CONTEXT ====================
  const context = await requireServerAuthContext('educator')
  const permissionStrings = await fetchPermissionStringsByUserId(context.profile.id)
  const permissions = getSubjectPermissions(permissionStrings)

  if (!permissions.canView) {
    redirect('/errors/forbidden')
  }

  // ==================== RENDER ====================
  return <SubjectsPageClient permissions={permissions} />
}
