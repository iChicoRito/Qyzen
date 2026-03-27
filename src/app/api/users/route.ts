import { NextResponse } from 'next/server'

interface CreateUserInput {
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

// getSupabaseConfig - read server env values
function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Supabase environment variables are missing.')
  }

  return {
    url,
    anonKey,
  }
}

// getSupabaseHeaders - build request headers
function getSupabaseHeaders() {
  const { anonKey } = getSupabaseConfig()

  return {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
  }
}

// getSupabaseErrorMessage - normalize api errors
function getSupabaseErrorMessage(error: SupabaseErrorResponse, fallbackMessage: string) {
  return error.message || fallbackMessage
}

// formatPasswordValue - replace spaces with underscores
function formatPasswordValue(value: string) {
  return value.trim().replace(/\s+/g, '_')
}

// generateUserPassword - create the initial password
function generateUserPassword(givenName: string, surname: string) {
  return `${formatPasswordValue(givenName)}_${formatPasswordValue(surname)}`
}

// mapUserRow - convert db row to api response
function mapUserRow(row: UserRow, roleNames: string[]) {
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

// getRoleIdsByNames - resolve role ids from names
async function getRoleIdsByNames(roleNames: string[]) {
  if (roleNames.length === 0) {
    return [] as number[]
  }

  const { url } = getSupabaseConfig()
  const joinedRoleNames = roleNames.map((roleName) => `"${roleName}"`).join(',')
  const response = await fetch(`${url}/rest/v1/roles?select=id,name&name=in.(${joinedRoleNames})`, {
    headers: getSupabaseHeaders(),
    cache: 'no-store',
  })

  if (!response.ok) {
    const error = (await response.json()) as SupabaseErrorResponse
    throw new Error(getSupabaseErrorMessage(error, 'Failed to resolve roles.'))
  }

  const rows = (await response.json()) as RoleLookupRow[]
  return rows.map((row) => row.id)
}

// createAuthUser - create auth user and trigger email confirmation
async function createAuthUser(user: CreateUserInput, password: string) {
  const { url } = getSupabaseConfig()
  const response = await fetch(`${url}/auth/v1/signup`, {
    method: 'POST',
    headers: getSupabaseHeaders(),
    body: JSON.stringify({
      email: user.email,
      password,
      data: {
        surname: user.surname,
        given_name: user.givenName,
        email_address: user.email,
        password,
        status: user.status,
        user_type: user.userType,
        role: user.roleNames.join(', '),
      },
    }),
  })

  if (!response.ok) {
    const error = (await response.json()) as SupabaseErrorResponse
    throw new Error(getSupabaseErrorMessage(error, 'Failed to create auth user.'))
  }
}

// createPublicUser - insert public user record
async function createPublicUser(user: CreateUserInput) {
  const { url } = getSupabaseConfig()
  const response = await fetch(`${url}/rest/v1/users`, {
    method: 'POST',
    headers: {
      ...getSupabaseHeaders(),
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

  if (!response.ok) {
    const error = (await response.json()) as SupabaseErrorResponse

    if (error.code === '23505') {
      throw new Error('User ID or email already exists.')
    }

    throw new Error(getSupabaseErrorMessage(error, 'Failed to create user record.'))
  }

  const rows = (await response.json()) as UserRow[]
  return rows[0]
}

// assignUserRoles - insert user role records
async function assignUserRoles(userId: number, roleNames: string[]) {
  const roleIds = await getRoleIdsByNames(roleNames)

  if (roleIds.length === 0) {
    return
  }

  const { url } = getSupabaseConfig()
  const response = await fetch(`${url}/rest/v1/user_roles`, {
    method: 'POST',
    headers: getSupabaseHeaders(),
    body: JSON.stringify(
      roleIds.map((roleId) => ({
        user_id: userId,
        role_id: roleId,
      }))
    ),
  })

  if (!response.ok) {
    const error = (await response.json()) as SupabaseErrorResponse
    throw new Error(getSupabaseErrorMessage(error, 'Failed to assign user roles.'))
  }
}

// POST - create auth user, public user, and role assignments
export async function POST(request: Request) {
  try {
    const user = (await request.json()) as CreateUserInput
    const password = generateUserPassword(user.givenName, user.surname)

    await createAuthUser(user, password)
    const createdUser = await createPublicUser(user)
    await assignUserRoles(createdUser.id, user.roleNames)

    return NextResponse.json(mapUserRow(createdUser, user.roleNames))
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'Failed to create user.',
      },
      {
        status: 400,
      }
    )
  }
}
