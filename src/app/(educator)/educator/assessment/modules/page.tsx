import { redirect } from 'next/navigation'

import { getModulePermissions } from '@/lib/auth/module-permissions'
import { requireServerAuthContext } from '@/lib/auth/server'
import { fetchPermissionStringsByUserId } from '@/lib/auth/server-permissions'

import { ModulesPageClient } from './components/modules-page-client'

// ModulesPage - protect educator modules by rbac
export default async function ModulesPage() {
  // ==================== LOAD CONTEXT ====================
  const context = await requireServerAuthContext('educator')
  const permissionStrings = await fetchPermissionStringsByUserId(context.profile.id)
  const permissions = getModulePermissions(permissionStrings)

  if (!permissions.canView) {
    redirect('/errors/forbidden')
  }

  // ==================== RENDER ====================
  return <ModulesPageClient permissions={permissions} />
}
