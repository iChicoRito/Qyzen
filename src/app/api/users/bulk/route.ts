import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createManagedUser } from '@/lib/users/create-user'
import { getRoleIdMapByNames } from '@/lib/users/create-user'
import { bulkStudentCreateSchema } from '@/lib/validations/student-upload.schema'

import type { CreateUserInput } from '@/lib/users/create-user'

interface ExistingUserRow {
  user_id: string
  email: string
}

// buildDuplicateValues - find duplicate values inside a request
function buildDuplicateValues(values: string[]) {
  const valueCounts = new Map<string, number>()

  values.forEach((value) => {
    valueCounts.set(value, (valueCounts.get(value) || 0) + 1)
  })

  return Array.from(valueCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([value]) => value)
}

// validateDuplicateStudents - reject duplicate ids and emails before insert
async function validateDuplicateStudents(students: CreateUserInput[]) {
  const requestUserIds = students.map((student) => student.userId)
  const requestEmails = students.map((student) => student.email.toLowerCase())
  const duplicateUserIds = buildDuplicateValues(requestUserIds)
  const duplicateEmails = buildDuplicateValues(requestEmails)

  if (duplicateUserIds.length > 0) {
    throw new Error(`Duplicate user ID found in upload: ${duplicateUserIds[0]}.`)
  }

  if (duplicateEmails.length > 0) {
    throw new Error(`Duplicate email found in upload: ${duplicateEmails[0]}.`)
  }

  const supabase = await createClient()
  const [{ data: existingUserIds, error: userIdError }, { data: existingEmails, error: emailError }] =
    await Promise.all([
      supabase.from('tbl_users').select('user_id').in('user_id', requestUserIds),
      supabase.from('tbl_users').select('email').in('email', requestEmails),
    ])

  if (userIdError || emailError) {
    throw new Error('Failed to validate existing users before upload.')
  }

  const matchedUserId = (existingUserIds as Array<Pick<ExistingUserRow, 'user_id'>> | null)?.[0]?.user_id
  const matchedEmail = (existingEmails as Array<Pick<ExistingUserRow, 'email'>> | null)?.[0]?.email

  if (matchedUserId || matchedEmail) {
    throw new Error('User ID or email already exists.')
  }
}

// POST - create multiple student users using the manual add flow
export async function POST(request: Request) {
  try {
    const payload = bulkStudentCreateSchema.parse(await request.json())
    const students: CreateUserInput[] = payload.students.map((student) => ({
      userId: student.userId,
      givenName: student.givenName,
      surname: student.surname,
      email: student.email.toLowerCase(),
      status: 'active',
      userType: 'student',
      roleNames: student.roleNames,
    }))

    await validateDuplicateStudents(students)

    const roleIdMap = await getRoleIdMapByNames(students.flatMap((student) => student.roleNames))
    const createdUsers = []

    for (const student of students) {
      const createdUser = await createManagedUser(student, roleIdMap)
      createdUsers.push(createdUser)
    }

    return NextResponse.json({ users: createdUsers })
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'Failed to upload students.',
      },
      {
        status: 400,
      }
    )
  }
}
