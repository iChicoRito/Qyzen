import { createClient } from '@/lib/supabase/server'

interface RoleRow {
  is_active: boolean
}

interface UserRoleRow {
  role_id: number
  role: RoleRow | RoleRow[] | null
}

interface PermissionRow {
  permission_string: string
  is_active: boolean
}

interface RolePermissionRow {
  permission: PermissionRow | PermissionRow[] | null
}

// fetchPermissionStringsByUserId - load active permission strings for a user
export async function fetchPermissionStringsByUserId(userId: number) {
  const supabase = await createClient()
  const { data: userRoleData, error: userRoleError } = await supabase
    .from('tbl_user_roles')
    .select('role_id,role:role_id(is_active)')
    .eq('user_id', userId)
    .is('deleted_at', null)

  if (userRoleError) {
    throw new Error(userRoleError.message || 'Failed to load user roles.')
  }

  const roleIds = ((userRoleData || []) as UserRoleRow[])
    .filter((userRole) => {
      const role = Array.isArray(userRole.role) ? userRole.role[0] : userRole.role
      return Boolean(role?.is_active)
    })
    .map((userRole) => userRole.role_id)

  if (roleIds.length === 0) {
    return [] as string[]
  }

  const { data: rolePermissionData, error: rolePermissionError } = await supabase
    .from('tbl_role_permissions')
    .select('permission:permission_id(permission_string,is_active)')
    .in('role_id', roleIds)

  if (rolePermissionError) {
    throw new Error(rolePermissionError.message || 'Failed to load role permissions.')
  }

  return Array.from(
    new Set(
      ((rolePermissionData || []) as RolePermissionRow[])
        .map((rolePermission) =>
          Array.isArray(rolePermission.permission)
            ? rolePermission.permission[0]
            : rolePermission.permission
        )
        .filter((permission): permission is PermissionRow => Boolean(permission?.is_active))
        .map((permission) => permission.permission_string)
    )
  )
}
