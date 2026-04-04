import { createClient } from '@/lib/supabase/server'

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

interface SupabaseErrorResponse {
  code?: string
  message?: string
}

// getSupabaseErrorMessage - normalize api errors
export function getSupabaseErrorMessage(error: SupabaseErrorResponse | null, fallbackMessage: string) {
  return error?.message || fallbackMessage
}

// formatPasswordValue - replace spaces with underscores
function formatPasswordValue(value: string) {
  return value.trim().replace(/\s+/g, '_')
}

// buildNormalizedRoleNames - create a unique role name list
function buildNormalizedRoleNames(roleNames: string[]) {
  return Array.from(new Set(roleNames.map((roleName) => roleName.trim()).filter(Boolean)))
}

// generateUserPassword - create the initial password
export function generateUserPassword(givenName: string, surname: string) {
  return `${formatPasswordValue(givenName)}_${formatPasswordValue(surname)}`
}

// mapUserRow - convert db row to api response
export function mapUserRow(row: UserRow, roleNames: string[]): UserRecord {
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

// getRoleIdMapByNames - resolve role ids from role names
export async function getRoleIdMapByNames(roleNames: string[]) {
  const normalizedRoleNames = buildNormalizedRoleNames(roleNames)

  if (normalizedRoleNames.length === 0) {
    return new Map<string, number>()
  }

  const supabase = await createClient()
  const { data: rows, error } = await supabase
    .from('tbl_roles')
    .select('id,name')
    .in('name', normalizedRoleNames)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to resolve roles.'))
  }

  const roleMap = new Map<string, number>()

  ;((rows || []) as RoleLookupRow[]).forEach((row) => {
    roleMap.set(row.name, row.id)
  })

  const missingRoleNames = normalizedRoleNames.filter((roleName) => !roleMap.has(roleName))

  if (missingRoleNames.length > 0) {
    throw new Error(`Selected role does not exist: ${missingRoleNames.join(', ')}.`)
  }

  return roleMap
}

// createAuthUser - create auth user and trigger email confirmation
export async function createAuthUser(user: CreateUserInput, password: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: user.email,
    password,
    options: {
      data: {
        surname: user.surname,
        given_name: user.givenName,
        email_address: user.email,
        password,
        status: user.status,
        user_type: user.userType,
        role: user.roleNames.join(', '),
      },
    },
  })

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to create auth user.'))
  }
}

// createPublicUser - insert public user record
export async function createPublicUser(user: CreateUserInput) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tbl_users')
    .insert({
      user_type: user.userType,
      user_id: user.userId,
      given_name: user.givenName,
      surname: user.surname,
      email: user.email,
      is_active: user.status === 'active',
    })
    .select('id,user_type,user_id,given_name,surname,email,is_active')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('User ID or email already exists.')
    }

    throw new Error(getSupabaseErrorMessage(error, 'Failed to create user record.'))
  }

  return data as UserRow
}

// assignUserRoles - insert user role records
export async function assignUserRoles(userId: number, roleNames: string[], roleIdMap?: Map<string, number>) {
  const resolvedRoleMap = roleIdMap ?? (await getRoleIdMapByNames(roleNames))
  const normalizedRoleNames = buildNormalizedRoleNames(roleNames)
  const roleIds = normalizedRoleNames.map((roleName) => {
    const roleId = resolvedRoleMap.get(roleName)

    if (!roleId) {
      throw new Error(`Selected role does not exist: ${roleName}.`)
    }

    return roleId
  })

  if (roleIds.length === 0) {
    return
  }

  const supabase = await createClient()
  const { error } = await supabase.from('tbl_user_roles').insert(
    roleIds.map((roleId) => ({
      user_id: userId,
      role_id: roleId,
    }))
  )

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to assign user roles.'))
  }
}

// createManagedUser - create auth user, public row, and role links
export async function createManagedUser(user: CreateUserInput, roleIdMap?: Map<string, number>) {
  const password = generateUserPassword(user.givenName, user.surname)

  await createAuthUser(user, password)
  const createdUser = await createPublicUser(user)
  await assignUserRoles(createdUser.id, user.roleNames, roleIdMap)

  return mapUserRow(createdUser, user.roleNames)
}
