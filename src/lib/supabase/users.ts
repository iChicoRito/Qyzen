'use client'

import { getSupabaseClientConfig, getSupabaseClientHeaders } from './client'

export interface UserRecord {
  id: number
  userId: string
  givenName: string
  surname: string
  email: string
  status: 'active' | 'inactive'
  userType: 'admin' | 'student' | 'educator'
  roleNames: string[]
}

export interface CreateUserInput {
  userId: string
  givenName: string
  surname: string
  email: string
  status: 'active' | 'inactive'
  userType: 'student' | 'educator'
  roleNames: string[]
}

interface UserRow {
  id: number
  user_type: 'admin' | 'student' | 'educator'
  user_id: string
  given_name: string
  surname: string
  email: string
  is_active: boolean
}

interface RoleLookupRow {
  id: number
  name: string
}

interface UserRoleRow {
  user_id: number
  role: RoleLookupRow | RoleLookupRow[] | null
}

interface SupabaseErrorResponse {
  code?: string
  message?: string
}

// getSupabaseErrorMessage - normalize api errors
function getSupabaseErrorMessage(error: SupabaseErrorResponse, fallbackMessage: string) {
  return error.message || fallbackMessage
}

// mapUserRow - convert db row to ui record
function mapUserRow(row: UserRow, roleNames: string[]): UserRecord {
  return {
    id: row.id,
    userId: row.user_id,
    givenName: row.given_name,
    surname: row.surname,
    email: row.email,
    status: row.is_active ? 'active' : 'inactive',
    userType: row.user_type,
    roleNames,
  }
}

// getRoleIdsByNames - resolve role ids by role names
async function getRoleIdsByNames(roleNames: string[]) {
  if (roleNames.length === 0) {
    return [] as number[]
  }

  const { url } = getSupabaseClientConfig()
  const joinedRoleNames = roleNames.map((roleName) => `"${roleName}"`).join(',')
  const response = await fetch(`${url}/rest/v1/roles?select=id,name&name=in.(${joinedRoleNames})`, {
    headers: getSupabaseClientHeaders(),
    cache: 'no-store',
  })

  if (!response.ok) {
    const error = (await response.json()) as SupabaseErrorResponse
    throw new Error(getSupabaseErrorMessage(error, 'Failed to resolve roles.'))
  }

  const rows = (await response.json()) as RoleLookupRow[]
  return rows.map((row) => row.id)
}

// fetchUsers - load users with assigned roles
export async function fetchUsers() {
  const { url } = getSupabaseClientConfig()
  const [usersResponse, rolesResponse] = await Promise.all([
    fetch(
      `${url}/rest/v1/users?select=id,user_type,user_id,given_name,surname,email,is_active&order=id.desc`,
      {
        headers: getSupabaseClientHeaders(),
        cache: 'no-store',
      }
    ),
    fetch(`${url}/rest/v1/user_roles?select=user_id,role:role_id(id,name)`, {
      headers: getSupabaseClientHeaders(),
      cache: 'no-store',
    }),
  ])

  if (!usersResponse.ok) {
    const error = (await usersResponse.json()) as SupabaseErrorResponse
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load users.'))
  }

  if (!rolesResponse.ok) {
    const error = (await rolesResponse.json()) as SupabaseErrorResponse
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load user roles.'))
  }

  const userRows = (await usersResponse.json()) as UserRow[]
  const userRoleRows = (await rolesResponse.json()) as UserRoleRow[]
  const roleMap = userRoleRows.reduce<Record<number, string[]>>((result, row) => {
    const role = Array.isArray(row.role) ? row.role[0] : row.role

    if (!role) {
      return result
    }

    result[row.user_id] = [...(result[row.user_id] || []), role.name]
    return result
  }, {})

  return userRows.map((row) => mapUserRow(row, roleMap[row.id] || []))
}

// createUser - insert a user and assign roles
export async function createUser(user: CreateUserInput) {
  const { url } = getSupabaseClientConfig()
  const createUserResponse = await fetch(`${url}/rest/v1/users`, {
    method: 'POST',
    headers: {
      ...getSupabaseClientHeaders(),
      Prefer: 'return=representation',
    },
    body: JSON.stringify([
      {
        user_type: user.userType,
        user_id: user.userId,
        given_name: user.givenName,
        surname: user.surname,
        email: user.email,
        is_active: user.status === 'active',
      },
    ]),
  })

  if (!createUserResponse.ok) {
    const error = (await createUserResponse.json()) as SupabaseErrorResponse

    if (error.code === '23505') {
      throw new Error('User ID or email already exists.')
    }

    throw new Error(getSupabaseErrorMessage(error, 'Failed to create user.'))
  }

  const createdRows = (await createUserResponse.json()) as UserRow[]
  const createdUser = createdRows[0]
  const roleIds = await getRoleIdsByNames(user.roleNames)

  if (roleIds.length > 0) {
    const assignRolesResponse = await fetch(`${url}/rest/v1/user_roles`, {
      method: 'POST',
      headers: getSupabaseClientHeaders(),
      body: JSON.stringify(
        roleIds.map((roleId) => ({
          user_id: createdUser.id,
          role_id: roleId,
        }))
      ),
    })

    if (!assignRolesResponse.ok) {
      const error = (await assignRolesResponse.json()) as SupabaseErrorResponse
      throw new Error(getSupabaseErrorMessage(error, 'Failed to assign user roles.'))
    }
  }

  return mapUserRow(createdUser, user.roleNames)
}
