import { getSupabaseClientConfig, getSupabaseClientHeaders } from './client'

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
function getSupabaseErrorMessage(error: SupabaseErrorResponse, fallbackMessage: string) {
  return error.message || fallbackMessage
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
  const { url } = getSupabaseClientConfig()
  const response = await fetch(
    `${url}/rest/v1/tbl_roles?select=id&name=eq.${encodeURIComponent(roleName)}&limit=1`,
    {
      headers: getSupabaseClientHeaders(),
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    const error = (await response.json()) as SupabaseErrorResponse
    throw new Error(getSupabaseErrorMessage(error, 'Failed to resolve role.'))
  }

  const rows = (await response.json()) as Array<{ id: number }>

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

  const { url } = getSupabaseClientConfig()
  const joinedPermissionStrings = permissionStrings
    .map((permissionString) => `"${permissionString}"`)
    .join(',')
  const response = await fetch(
    `${url}/rest/v1/tbl_permissions?select=id,permission_string&permission_string=in.(${joinedPermissionStrings})`,
    {
      headers: getSupabaseClientHeaders(),
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    const error = (await response.json()) as SupabaseErrorResponse
    throw new Error(getSupabaseErrorMessage(error, 'Failed to resolve permissions.'))
  }

  const rows = (await response.json()) as Array<{ id: number; permission_string: string }>
  return rows.map((row) => row.id)
}

// fetchRoles - load roles
export async function fetchRoles() {
  const { url } = getSupabaseClientConfig()
  const [rolesResponse, assignmentsResponse] = await Promise.all([
    fetch(`${url}/rest/v1/tbl_roles?select=id,name,description,is_system,is_active&order=id.desc`, {
      headers: getSupabaseClientHeaders(),
      cache: 'no-store',
    }),
    fetch(`${url}/rest/v1/tbl_role_permissions?select=role_id`, {
      headers: getSupabaseClientHeaders(),
      cache: 'no-store',
    }),
  ])

  if (!rolesResponse.ok) {
    const error = (await rolesResponse.json()) as SupabaseErrorResponse
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load roles.'))
  }

  if (!assignmentsResponse.ok) {
    const error = (await assignmentsResponse.json()) as SupabaseErrorResponse
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load role permissions.'))
  }

  const rows = (await rolesResponse.json()) as RoleRow[]
  const assignmentRows = (await assignmentsResponse.json()) as RoleAssignmentRow[]
  const permissionCounts = assignmentRows.reduce<Record<number, number>>((counts, row) => {
    counts[row.role_id] = (counts[row.role_id] || 0) + 1
    return counts
  }, {})

  return rows.map((row) => ({
    ...mapRoleRow(row),
    permissionsCount: permissionCounts[row.id] || 0,
  }))
}

// createRole - insert role row
export async function createRole(role: RoleRecord) {
  const { url } = getSupabaseClientConfig()
  const response = await fetch(`${url}/rest/v1/tbl_roles`, {
    method: 'POST',
    headers: {
      ...getSupabaseClientHeaders(),
      Prefer: 'return=representation',
    },
    body: JSON.stringify([
      {
        name: role.roleName,
        description: role.description,
        is_system: role.isSystem,
        is_active: role.status === 'active',
      },
    ]),
  })

  if (!response.ok) {
    const error = (await response.json()) as SupabaseErrorResponse

    if (error.code === '23505') {
      throw new Error('Role already exists.')
    }

    throw new Error(getSupabaseErrorMessage(error, 'Failed to create role.'))
  }

  const rows = (await response.json()) as RoleRow[]
  return mapRoleRow(rows[0])
}

// deleteRole - remove role row
export async function deleteRole(role: RoleRecord) {
  const { url } = getSupabaseClientConfig()
  const response = await fetch(`${url}/rest/v1/tbl_roles?name=eq.${encodeURIComponent(role.roleName)}`, {
    method: 'DELETE',
    headers: getSupabaseClientHeaders(),
  })

  if (!response.ok) {
    const error = (await response.json()) as SupabaseErrorResponse
    throw new Error(getSupabaseErrorMessage(error, 'Failed to delete role.'))
  }
}

// fetchPermissionsForRole - load permissions assigned to a role
export async function fetchPermissionsForRole(roleName: string) {
  const { url } = getSupabaseClientConfig()
  const roleId = await getRoleIdByName(roleName)
  const query =
    'select=permission:permission_id(id,name,description,resource,action,module,permission_string,is_active)'
  const response = await fetch(`${url}/rest/v1/tbl_role_permissions?role_id=eq.${roleId}&${query}`, {
    headers: getSupabaseClientHeaders(),
    cache: 'no-store',
  })

  if (!response.ok) {
    const error = (await response.json()) as SupabaseErrorResponse
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load role permissions.'))
  }

  const rows = (await response.json()) as RolePermissionRow[]
  return rows
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
  const { url } = getSupabaseClientConfig()
  const roleId = await getRoleIdByName(currentRoleName)

  const updateRoleResponse = await fetch(`${url}/rest/v1/tbl_roles?id=eq.${roleId}`, {
    method: 'PATCH',
    headers: {
      ...getSupabaseClientHeaders(),
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      name: role.roleName,
      description: role.description,
      is_system: role.isSystem,
      is_active: role.status === 'active',
    }),
  })

  if (!updateRoleResponse.ok) {
    const error = (await updateRoleResponse.json()) as SupabaseErrorResponse

    if (error.code === '23505') {
      throw new Error('Role already exists.')
    }

    throw new Error(getSupabaseErrorMessage(error, 'Failed to update role.'))
  }

  const deleteAssignmentsResponse = await fetch(`${url}/rest/v1/tbl_role_permissions?role_id=eq.${roleId}`, {
    method: 'DELETE',
    headers: getSupabaseClientHeaders(),
  })

  if (!deleteAssignmentsResponse.ok) {
    const error = (await deleteAssignmentsResponse.json()) as SupabaseErrorResponse
    throw new Error(getSupabaseErrorMessage(error, 'Failed to reset role permissions.'))
  }

  const permissionIds = await getPermissionIdsByStrings(permissionStrings)

  if (permissionIds.length > 0) {
    const insertAssignmentsResponse = await fetch(`${url}/rest/v1/tbl_role_permissions`, {
      method: 'POST',
      headers: getSupabaseClientHeaders(),
      body: JSON.stringify(
        permissionIds.map((permissionId) => ({
          role_id: roleId,
          permission_id: permissionId,
        }))
      ),
    })

    if (!insertAssignmentsResponse.ok) {
      const error = (await insertAssignmentsResponse.json()) as SupabaseErrorResponse
      throw new Error(getSupabaseErrorMessage(error, 'Failed to save role permissions.'))
    }
  }

  return role
}

// fetchPermissions - load permissions
export async function fetchPermissions() {
  const { url } = getSupabaseClientConfig()
  const response = await fetch(
    `${url}/rest/v1/tbl_permissions?select=id,name,description,resource,action,module,permission_string,is_active&order=id.desc`,
    {
      headers: getSupabaseClientHeaders(),
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    const error = (await response.json()) as SupabaseErrorResponse
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load permissions.'))
  }

  const rows = (await response.json()) as PermissionRow[]
  return rows.map(mapPermissionRow)
}

// createPermissions - insert permission rows
export async function createPermissions(permissions: PermissionRecord[]) {
  const { url } = getSupabaseClientConfig()
  const response = await fetch(`${url}/rest/v1/tbl_permissions`, {
    method: 'POST',
    headers: {
      ...getSupabaseClientHeaders(),
      Prefer: 'return=representation',
    },
    body: JSON.stringify(
      permissions.map((permission) => ({
        name: permission.permissionName,
        description: permission.description,
        resource: permission.resource,
        action: permission.action,
        module: permission.module,
        is_active: permission.status === 'active',
      }))
    ),
  })

  if (!response.ok) {
    const error = (await response.json()) as SupabaseErrorResponse

    if (error.code === '23505') {
      throw new Error('One of the permission strings already exists.')
    }

    throw new Error(getSupabaseErrorMessage(error, 'Failed to create permissions.'))
  }

  const rows = (await response.json()) as PermissionRow[]
  return rows.map(mapPermissionRow)
}

// deletePermission - remove permission row
export async function deletePermission(permission: PermissionRecord) {
  const { url } = getSupabaseClientConfig()
  const response = await fetch(
    `${url}/rest/v1/tbl_permissions?permission_string=eq.${encodeURIComponent(permission.permissionString)}`,
    {
      method: 'DELETE',
      headers: getSupabaseClientHeaders(),
    }
  )

  if (!response.ok) {
    const error = (await response.json()) as SupabaseErrorResponse
    throw new Error(getSupabaseErrorMessage(error, 'Failed to delete permission.'))
  }
}
