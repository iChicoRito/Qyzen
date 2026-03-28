import { createClient } from './client'

export interface RoleRecord {
  roleName: string
  description: string
  permissionsCount: number
  status: 'active' | 'inactive'
  isSystem: boolean
}

export interface PermissionRecord {
  permissionName: string
  description: string
  resource: string
  action: string
  module: string
  permissionString: string
  status: 'active' | 'inactive'
}

interface RoleRow {
  id: number
  name: string
  description: string
  is_system: boolean
  is_active: boolean
}

interface RoleAssignmentRow {
  role_id: number
}

interface PermissionRow {
  id: number
  name: string
  description: string
  resource: string
  action: string
  module: string
  permission_string: string
  is_active: boolean
}

interface RolePermissionRow {
  permission: PermissionRow | PermissionRow[] | null
}

interface SupabaseErrorResponse {
  code?: string
  message?: string
}

// getSupabaseErrorMessage - normalize api errors
function getSupabaseErrorMessage(error: SupabaseErrorResponse | null, fallbackMessage: string) {
  return error?.message || fallbackMessage
}

// mapRoleRow - convert db row to ui record
function mapRoleRow(row: RoleRow): RoleRecord {
  return {
    roleName: row.name,
    description: row.description,
    permissionsCount: 0,
    status: row.is_active ? 'active' : 'inactive',
    isSystem: row.is_system,
  }
}

// mapPermissionRow - convert db row to ui record
function mapPermissionRow(row: PermissionRow): PermissionRecord {
  return {
    permissionName: row.name,
    description: row.description,
    resource: row.resource,
    action: row.action,
    module: row.module,
    permissionString: row.permission_string,
    status: row.is_active ? 'active' : 'inactive',
  }
}

// getRoleIdByName - resolve role id from role name
async function getRoleIdByName(roleName: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tbl_roles')
    .select('id')
    .eq('name', roleName)
    .limit(1)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to resolve role.'))
  }

  const rows = (data || []) as Array<{ id: number }>

  if (!rows[0]) {
    throw new Error('Selected role does not exist.')
  }

  return rows[0].id
}

// getPermissionIdsByStrings - resolve permission ids from permission strings
async function getPermissionIdsByStrings(permissionStrings: string[]) {
  if (permissionStrings.length === 0) {
    return [] as number[]
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('tbl_permissions')
    .select('id,permission_string')
    .in('permission_string', permissionStrings)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to resolve permissions.'))
  }

  return ((data || []) as Array<{ id: number }>).map((row) => row.id)
}

// fetchRoles - load roles
export async function fetchRoles() {
  const supabase = createClient()
  const [{ data: roleRows, error: rolesError }, { data: assignmentRows, error: assignmentsError }] =
    await Promise.all([
      supabase
        .from('tbl_roles')
        .select('id,name,description,is_system,is_active')
        .order('id', { ascending: false }),
      supabase.from('tbl_role_permissions').select('role_id'),
    ])

  if (rolesError) {
    throw new Error(getSupabaseErrorMessage(rolesError, 'Failed to load roles.'))
  }

  if (assignmentsError) {
    throw new Error(getSupabaseErrorMessage(assignmentsError, 'Failed to load role permissions.'))
  }

  const permissionCounts = ((assignmentRows || []) as RoleAssignmentRow[]).reduce<Record<number, number>>(
    (counts, row) => {
      counts[row.role_id] = (counts[row.role_id] || 0) + 1
      return counts
    },
    {}
  )

  return ((roleRows || []) as RoleRow[]).map((row) => ({
    ...mapRoleRow(row),
    permissionsCount: permissionCounts[row.id] || 0,
  }))
}

// createRole - insert role row
export async function createRole(role: RoleRecord) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tbl_roles')
    .insert({
      name: role.roleName,
      description: role.description,
      is_system: role.isSystem,
      is_active: role.status === 'active',
    })
    .select('id,name,description,is_system,is_active')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('Role already exists.')
    }

    throw new Error(getSupabaseErrorMessage(error, 'Failed to create role.'))
  }

  return mapRoleRow(data as RoleRow)
}

// deleteRole - remove role row
export async function deleteRole(role: RoleRecord) {
  const supabase = createClient()
  const { error } = await supabase.from('tbl_roles').delete().eq('name', role.roleName)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to delete role.'))
  }
}

// fetchPermissionsForRole - load permissions assigned to a role
export async function fetchPermissionsForRole(roleName: string) {
  const supabase = createClient()
  const roleId = await getRoleIdByName(roleName)
  const { data, error } = await supabase
    .from('tbl_role_permissions')
    .select('permission:permission_id(id,name,description,resource,action,module,permission_string,is_active)')
    .eq('role_id', roleId)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load role permissions.'))
  }

  return ((data || []) as RolePermissionRow[])
    .map((row) => (Array.isArray(row.permission) ? row.permission[0] : row.permission))
    .filter((permission): permission is PermissionRow => Boolean(permission))
    .map(mapPermissionRow)
}

// updateRoleWithPermissions - update role and sync role permissions
export async function updateRoleWithPermissions(
  currentRoleName: string,
  role: RoleRecord,
  permissionStrings: string[]
) {
  const supabase = createClient()
  const roleId = await getRoleIdByName(currentRoleName)

  const { error: updateError } = await supabase
    .from('tbl_roles')
    .update({
      name: role.roleName,
      description: role.description,
      is_system: role.isSystem,
      is_active: role.status === 'active',
    })
    .eq('id', roleId)

  if (updateError) {
    if (updateError.code === '23505') {
      throw new Error('Role already exists.')
    }

    throw new Error(getSupabaseErrorMessage(updateError, 'Failed to update role.'))
  }

  const { error: deleteAssignmentsError } = await supabase
    .from('tbl_role_permissions')
    .delete()
    .eq('role_id', roleId)

  if (deleteAssignmentsError) {
    throw new Error(getSupabaseErrorMessage(deleteAssignmentsError, 'Failed to reset role permissions.'))
  }

  const permissionIds = await getPermissionIdsByStrings(permissionStrings)

  if (permissionIds.length > 0) {
    const { error: insertAssignmentsError } = await supabase.from('tbl_role_permissions').insert(
      permissionIds.map((permissionId) => ({
        role_id: roleId,
        permission_id: permissionId,
      }))
    )

    if (insertAssignmentsError) {
      throw new Error(getSupabaseErrorMessage(insertAssignmentsError, 'Failed to save role permissions.'))
    }
  }

  return role
}

// fetchPermissions - load permissions
export async function fetchPermissions() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tbl_permissions')
    .select('id,name,description,resource,action,module,permission_string,is_active')
    .order('id', { ascending: false })

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load permissions.'))
  }

  return ((data || []) as PermissionRow[]).map(mapPermissionRow)
}

// createPermissions - insert permission rows
export async function createPermissions(permissions: PermissionRecord[]) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tbl_permissions')
    .insert(
      permissions.map((permission) => ({
        name: permission.permissionName,
        description: permission.description,
        resource: permission.resource,
        action: permission.action,
        module: permission.module,
        is_active: permission.status === 'active',
      }))
    )
    .select('id,name,description,resource,action,module,permission_string,is_active')

  if (error) {
    if (error.code === '23505') {
      throw new Error('One of the permission strings already exists.')
    }

    throw new Error(getSupabaseErrorMessage(error, 'Failed to create permissions.'))
  }

  return ((data || []) as PermissionRow[]).map(mapPermissionRow)
}

// deletePermission - remove permission row
export async function deletePermission(permission: PermissionRecord) {
  const supabase = createClient()
  const { error } = await supabase
    .from('tbl_permissions')
    .delete()
    .eq('permission_string', permission.permissionString)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to delete permission.'))
  }
}
