import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface UserRecord {
  id: number
  userId: string
  givenName: string
  surname: string
  email: string
  profilePicture: string | null
  coverPhoto: string | null
  status: 'active' | 'inactive'
  userType: 'admin' | 'student' | 'educator'
  roleNames: string[]
  isEmailVerified: boolean
  hasAuthUser: boolean
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
  profile_picture: string | null
  cover_photo: string | null
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

interface UserRoleRow {
  user_id: number
  role: RoleLookupRow | RoleLookupRow[] | null
}

interface AuthUserRecord {
  id: string
  email?: string | null
  email_confirmed_at?: string | null
  confirmed_at?: string | null
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

// normalizeEmail - keep email matching consistent across auth and public data
function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

// isAuthUserEmailVerified - read Supabase auth confirmation fields
function isAuthUserEmailVerified(user: AuthUserRecord) {
  return Boolean(user.email_confirmed_at || user.confirmed_at)
}

// buildAuthUserMap - create a unique auth lookup by normalized email
function buildAuthUserMap(authUsers: AuthUserRecord[]) {
  const authUserMap = new Map<string, AuthUserRecord>()

  authUsers.forEach((authUser) => {
    const normalizedEmail = normalizeEmail(authUser.email || '')

    if (!normalizedEmail) {
      return
    }

    if (authUserMap.has(normalizedEmail)) {
      throw new Error(`Multiple auth users were found for ${normalizedEmail}.`)
    }

    authUserMap.set(normalizedEmail, authUser)
  })

  return authUserMap
}

// generateUserPassword - create the initial password
export function generateUserPassword(givenName: string, surname: string) {
  return `${formatPasswordValue(givenName)}_${formatPasswordValue(surname)}`
}

// mapUserRow - convert db row to api response
export function mapUserRow(
  row: UserRow,
  roleNames: string[],
  authUser?: AuthUserRecord | null
): UserRecord {
  return {
    id: row.id,
    userId: row.user_id,
    givenName: row.given_name,
    surname: row.surname,
    email: row.email,
    profilePicture: row.profile_picture,
    coverPhoto: row.cover_photo,
    status: row.is_active ? 'active' : 'inactive',
    userType: row.user_type,
    roleNames,
    isEmailVerified: authUser ? isAuthUserEmailVerified(authUser) : false,
    hasAuthUser: Boolean(authUser),
  }
}

// listAllAuthUsers - load all auth users for admin matching
async function listAllAuthUsers() {
  const adminClient = createAdminClient()
  const authUsers: AuthUserRecord[] = []
  let page = 1
  const perPage = 200

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage,
    })

    if (error) {
      throw new Error(getSupabaseErrorMessage(error, 'Failed to load auth users.'))
    }

    const pageUsers = (data?.users || []) as AuthUserRecord[]
    authUsers.push(...pageUsers)

    if (pageUsers.length < perPage) {
      break
    }

    page += 1
  }

  return authUsers
}

// findAuthUsersByEmail - load auth users that match the public email
async function findAuthUsersByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email)
  const authUsers = await listAllAuthUsers()

  return authUsers.filter((authUser) => normalizeEmail(authUser.email || '') === normalizedEmail)
}

// findSingleAuthUserByEmail - resolve exactly one auth user by email
async function findSingleAuthUserByEmail(email: string) {
  const matchedAuthUsers = await findAuthUsersByEmail(email)

  if (matchedAuthUsers.length === 0) {
    return null
  }

  if (matchedAuthUsers.length > 1) {
    throw new Error(`Multiple auth users were found for ${normalizeEmail(email)}.`)
  }

  return matchedAuthUsers[0]
}

// getUserRoleMap - load assigned role names for public users
async function getUserRoleMap() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('tbl_user_roles').select('user_id,role:role_id(id,name)')

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load user roles.'))
  }

  return ((data || []) as UserRoleRow[]).reduce<Record<number, string[]>>(
    (result: Record<number, string[]>, row: UserRoleRow) => {
      const role = Array.isArray(row.role) ? row.role[0] : row.role

      if (!role) {
        return result
      }

      result[row.user_id] = [...(result[row.user_id] || []), role.name]
      return result
    },
    {}
  )
}

// getPublicUserById - load one public user row
async function getPublicUserById(userId: number) {
  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('tbl_users')
    .select('id,user_type,user_id,given_name,surname,email,profile_picture,cover_photo,is_active')
    .eq('id', userId)
    .is('deleted_at', null)
    .single()

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'User was not found.'))
  }

  return data as UserRow
}

// fetchManagedUsers - load admin users with auth verification status
export async function fetchManagedUsers() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tbl_users')
    .select('id,user_type,user_id,given_name,surname,email,profile_picture,cover_photo,is_active')
    .is('deleted_at', null)
    .order('id', { ascending: false })

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load users.'))
  }

  const [roleMap, authUsers] = await Promise.all([getUserRoleMap(), listAllAuthUsers()])
  const authUserMap = buildAuthUserMap(authUsers)

  return ((data || []) as UserRow[]).map((row) =>
    mapUserRow(row, roleMap[row.id] || [], authUserMap.get(normalizeEmail(row.email)) || null)
  )
}

// deleteManagedUser - delete the auth account and public user record
export async function deleteManagedUser(userId: number) {
  const publicUser = await getPublicUserById(userId)
  const authUser = await findSingleAuthUserByEmail(publicUser.email)

  if (!authUser) {
    throw new Error('The matching auth user was not found. The public user record was not deleted.')
  }

  const adminClient = createAdminClient()
  const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(authUser.id, false)

  if (authDeleteError) {
    throw new Error(getSupabaseErrorMessage(authDeleteError, 'Failed to delete auth user.'))
  }

  const { error: publicDeleteError } = await adminClient.from('tbl_users').delete().eq('id', userId)

  if (publicDeleteError) {
    throw new Error(
      `${getSupabaseErrorMessage(publicDeleteError, 'Failed to delete public user record.')} The auth user was already deleted.`
    )
  }

  return {
    id: userId,
  }
}

// resendManagedUserVerification - resend the signup verification email
export async function resendManagedUserVerification(userId: number, redirectTo: string) {
  const publicUser = await getPublicUserById(userId)
  const authUser = await findSingleAuthUserByEmail(publicUser.email)

  if (!authUser) {
    throw new Error('The matching auth user was not found.')
  }

  if (isAuthUserEmailVerified(authUser)) {
    throw new Error('This user has already verified their email address.')
  }

  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.resend({
    type: 'signup',
    email: normalizeEmail(publicUser.email),
    options: {
      emailRedirectTo: redirectTo,
    },
  })

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to resend verification email.'))
  }

  return {
    message: `Verification email resent to ${publicUser.email}.`,
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
    email: normalizeEmail(user.email),
    password,
    options: {
      data: {
        surname: user.surname,
        given_name: user.givenName,
        email_address: normalizeEmail(user.email),
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
      email: normalizeEmail(user.email),
      is_active: user.status === 'active',
    })
    .select('id,user_type,user_id,given_name,surname,email,profile_picture,cover_photo,is_active')
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

  return mapUserRow(createdUser, user.roleNames, {
    id: '',
    email: normalizeEmail(user.email),
    email_confirmed_at: null,
    confirmed_at: null,
  })
}
