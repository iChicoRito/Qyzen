import { createClient } from './client'
import { bulkStudentCreateSchema } from '@/lib/validations/student-upload.schema'

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

export interface BulkCreateStudentInput {
  userId: string
  givenName: string
  surname: string
  email: string
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
function getSupabaseErrorMessage(error: SupabaseErrorResponse | null, fallbackMessage: string) {
  return error?.message || fallbackMessage
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

// fetchUsers - load users with assigned roles
export async function fetchUsers() {
  const supabase = createClient()
  const [{ data: userRows, error: usersError }, { data: userRoleRows, error: rolesError }] =
    await Promise.all([
      supabase
        .from('tbl_users')
        .select('id,user_type,user_id,given_name,surname,email,is_active')
        .order('id', { ascending: false }),
      supabase.from('tbl_user_roles').select('user_id,role:role_id(id,name)'),
    ])

  if (usersError) {
    throw new Error(getSupabaseErrorMessage(usersError, 'Failed to load users.'))
  }

  if (rolesError) {
    throw new Error(getSupabaseErrorMessage(rolesError, 'Failed to load user roles.'))
  }

  const roleMap = ((userRoleRows || []) as unknown as UserRoleRow[]).reduce<Record<number, string[]>>(
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

  return ((userRows || []) as UserRow[]).map((row) => mapUserRow(row, roleMap[row.id] || []))
}

// createUser - insert a user and assign roles
export async function createUser(user: CreateUserInput) {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  })

  if (!response.ok) {
    const error = (await response.json()) as SupabaseErrorResponse
    throw new Error(getSupabaseErrorMessage(error, 'Failed to create user.'))
  }

  return (await response.json()) as UserRecord
}

// createStudentsBulk - create student users from uploaded rows
export async function createStudentsBulk(students: BulkCreateStudentInput[]) {
  const payload = bulkStudentCreateSchema.parse({ students })
  const response = await fetch('/api/users/bulk', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = (await response.json()) as SupabaseErrorResponse
    throw new Error(getSupabaseErrorMessage(error, 'Failed to upload students.'))
  }

  const data = (await response.json()) as { users: UserRecord[] }

  return data.users
}
