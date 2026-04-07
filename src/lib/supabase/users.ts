import { createClient } from './client'
import { getStoragePublicUrl } from './storage'
import { bulkStudentCreateSchema } from '@/lib/validations/student-upload.schema'

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

export interface BulkCreateStudentInput {
  userId: string
  givenName: string
  surname: string
  email: string
  roleNames: string[]
}

interface SupabaseErrorResponse {
  code?: string
  message?: string
}

// getSupabaseErrorMessage - normalize api errors
function getSupabaseErrorMessage(error: SupabaseErrorResponse | null, fallbackMessage: string) {
  return error?.message || fallbackMessage
}

// fetchUsers - load users with assigned roles
export async function fetchUsers() {
  const response = await fetch('/api/users')

  if (!response.ok) {
    const error = (await response.json()) as SupabaseErrorResponse
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load users.'))
  }

  const users = (await response.json()) as UserRecord[]

  return users.map((user) => ({
    ...user,
    profilePicture: getStoragePublicUrl('profile-media', user.profilePicture),
    coverPhoto: getStoragePublicUrl('profile-media', user.coverPhoto),
  }))
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

// deleteUser - remove a managed user from auth and public data
export async function deleteUser(userId: number) {
  const response = await fetch(`/api/users/${userId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = (await response.json()) as SupabaseErrorResponse
    throw new Error(getSupabaseErrorMessage(error, 'Failed to delete user.'))
  }

  return (await response.json()) as { id: number }
}

// resendUserVerificationEmail - resend the signup verification email
export async function resendUserVerificationEmail(userId: number) {
  const response = await fetch(`/api/users/${userId}/resend-verification`, {
    method: 'POST',
  })

  if (!response.ok) {
    const error = (await response.json()) as SupabaseErrorResponse
    throw new Error(getSupabaseErrorMessage(error, 'Failed to resend verification email.'))
  }

  return (await response.json()) as { message: string }
}
