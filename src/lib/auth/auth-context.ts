export type AppRole = 'admin' | 'educator' | 'student'

interface AuthUser {
  email?: string | null
  email_confirmed_at?: string | null
  confirmed_at?: string | null
}

interface QueryError {
  message: string
}

interface QueryResult<T> {
  data: T | null
  error: QueryError | null
}

interface AuthSupabaseClient {
  from(table: string): {
    select(columns: string): unknown
  }
}

export interface AuthContextUser {
  id: number
  email: string
  givenName: string
  surname: string
  isActive: boolean
  userType: string
}

export interface AuthContext {
  authUser: AuthUser
  profile: AuthContextUser
  role: AppRole | null
  roles: AppRole[]
  dashboardPath: string | null
  isActive: boolean
  isEmailVerified: boolean
}

interface UserProfileRow {
  id: number
  email: string
  given_name: string
  surname: string
  is_active: boolean
  user_type: string
}

interface RoleRow {
  name: string
  is_active: boolean
}

interface UserRoleRow {
  role: RoleRow | RoleRow[] | null
}

// normalizeRole - normalize app role values
export function normalizeRole(roleName: string | null | undefined): AppRole | null {
  if (!roleName) {
    return null
  }

  const normalizedRole = roleName.trim().toLowerCase()

  if (normalizedRole === 'admin' || normalizedRole === 'educator' || normalizedRole === 'student') {
    return normalizedRole
  }

  return null
}

// getRoleLabel - format role label for ui
export function getRoleLabel(role: AppRole) {
  return role.charAt(0).toUpperCase() + role.slice(1)
}

// getDashboardPathForRole - resolve dashboard path by role
export function getDashboardPathForRole(role: AppRole) {
  if (role === 'admin') {
    return '/admin/dashboard'
  }

  if (role === 'educator') {
    return '/educator/dashboard'
  }

  return '/student/dashboard'
}

// getDashboardPathForRoles - resolve dashboard path from assigned roles
export function getDashboardPathForRoles(roles: AppRole[], fallbackRole?: AppRole | null) {
  const primaryRole = getPrimaryRole(roles, fallbackRole)

  if (!primaryRole) {
    return null
  }

  return getDashboardPathForRole(primaryRole)
}

// getRoleFromPathname - resolve protected role route
export function getRoleFromPathname(pathname: string): AppRole | null {
  if (pathname.startsWith('/admin')) {
    return 'admin'
  }

  if (pathname.startsWith('/educator')) {
    return 'educator'
  }

  if (pathname.startsWith('/student')) {
    return 'student'
  }

  return null
}

// isEmailVerified - check auth email confirmation
export function isEmailVerified(user: AuthUser) {
  return Boolean(user.email_confirmed_at || user.confirmed_at)
}

// getPrimaryRole - resolve main role for navigation
export function getPrimaryRole(
  roleNames: Array<string | AppRole>,
  fallbackRole?: string | AppRole | null
): AppRole | null {
  const normalizedRoles = roleNames
    .map((roleName) => normalizeRole(roleName))
    .filter((role): role is AppRole => Boolean(role))

  if (normalizedRoles.includes('admin')) {
    return 'admin'
  }

  if (normalizedRoles.includes('educator')) {
    return 'educator'
  }

  if (normalizedRoles.includes('student')) {
    return 'student'
  }

  return normalizeRole(fallbackRole)
}

// fetchAuthContext - load app user and role context
export async function fetchAuthContext(
  supabase: AuthSupabaseClient,
  authUser: AuthUser
): Promise<AuthContext> {
  const email = authUser.email?.trim().toLowerCase()

  if (!email) {
    throw new Error('Authenticated user email is missing.')
  }

  const profileQuery = supabase.from('tbl_users').select('id,email,given_name,surname,is_active,user_type')
  const { data: profileData, error: profileError } = (await (profileQuery as {
    eq(column: string, value: string): {
      is(column: string, value: null): {
        single(): Promise<QueryResult<UserProfileRow>>
      }
    }
  })
    .eq('email', email)
    .is('deleted_at', null)
    .single()) as QueryResult<UserProfileRow>

  const profile = profileData as UserProfileRow | null

  if (profileError || !profile) {
    throw new Error(profileError?.message || 'User profile was not found.')
  }

  const userRolesQuery = supabase.from('tbl_user_roles').select('role:role_id(name,is_active)')
  const { data: userRolesData, error: userRolesError } = (await (userRolesQuery as {
    eq(column: string, value: number): {
      is(column: string, value: null): Promise<QueryResult<UserRoleRow[]>>
    }
  })
    .eq('user_id', profile.id)
    .is('deleted_at', null)) as QueryResult<UserRoleRow[]>

  const userRoles = (userRolesData || []) as UserRoleRow[]

  if (userRolesError) {
    throw new Error(userRolesError.message || 'User roles were not found.')
  }

  const roleNames = (userRoles || [])
    .map((userRole: UserRoleRow) => (Array.isArray(userRole.role) ? userRole.role[0] : userRole.role))
    .filter((role): role is RoleRow => role !== null && role !== undefined && role.is_active)
    .map((role: RoleRow) => role.name)

  const normalizedRoles = roleNames
    .map((roleName: string) => normalizeRole(roleName))
    .filter((roleName): roleName is AppRole => Boolean(roleName))
  const role = getPrimaryRole(normalizedRoles, profile.user_type)

  return {
    authUser,
    profile: {
      id: profile.id,
      email: profile.email,
      givenName: profile.given_name,
      surname: profile.surname,
      isActive: profile.is_active,
      userType: profile.user_type,
    },
    role,
    roles: normalizedRoles,
    dashboardPath: getDashboardPathForRoles(normalizedRoles, role),
    isActive: profile.is_active,
    isEmailVerified: isEmailVerified(authUser),
  }
}
