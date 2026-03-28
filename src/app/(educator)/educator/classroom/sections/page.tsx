import { redirect } from 'next/navigation'

import { getSectionPermissions } from '@/lib/auth/section-permissions'
import { fetchPermissionStringsByUserId } from '@/lib/auth/server-permissions'
import { requireServerAuthContext } from '@/lib/auth/server'

import { SectionsPageClient } from './components/sections-page-client'

// SectionsPage - protect educator section module by rbac
export default async function SectionsPage() {
  // ==================== LOAD CONTEXT ====================
  const context = await requireServerAuthContext('educator')
  const permissionStrings = await fetchPermissionStringsByUserId(context.profile.id)
  const permissions = getSectionPermissions(permissionStrings)

  if (!permissions.canView) {
    redirect('/errors/forbidden')
  }

  // ==================== RENDER ====================
  return <SectionsPageClient permissions={permissions} />
}
