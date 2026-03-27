import { getSupabaseClientConfig, getSupabaseClientHeaders } from './client'

export interface RoleRecord {
  roleName: string
  description: string
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

// fetchRoles - load roles
export async function fetchRoles() {
  const { url } = getSupabaseClientConfig()
  const response = await fetch(
    `${url}/rest/v1/roles?select=id,name,description,is_system,is_active&order=id.desc`,
    {
      headers: getSupabaseClientHeaders(),
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    const error = (await response.json()) as SupabaseErrorResponse
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load roles.'))
  }

  const rows = (await response.json()) as RoleRow[]
  return rows.map(mapRoleRow)
}

// createRole - insert role row
export async function createRole(role: RoleRecord) {
  const { url } = getSupabaseClientConfig()
  const response = await fetch(`${url}/rest/v1/roles`, {
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
  const response = await fetch(`${url}/rest/v1/roles?name=eq.${encodeURIComponent(role.roleName)}`, {
    method: 'DELETE',
    headers: getSupabaseClientHeaders(),
  })

  if (!response.ok) {
    const error = (await response.json()) as SupabaseErrorResponse
    throw new Error(getSupabaseErrorMessage(error, 'Failed to delete role.'))
  }
}

// fetchPermissions - load permissions
export async function fetchPermissions() {
  const { url } = getSupabaseClientConfig()
  const response = await fetch(
    `${url}/rest/v1/permissions?select=id,name,description,resource,action,module,permission_string,is_active&order=id.desc`,
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
  const response = await fetch(`${url}/rest/v1/permissions`, {
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
    `${url}/rest/v1/permissions?permission_string=eq.${encodeURIComponent(permission.permissionString)}`,
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
