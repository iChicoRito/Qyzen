'use client'

import type { NotificationInsertInput } from '@/types/notification'

import { insertNotifications } from './notifications'
import { createClient } from './client'

export interface EnrollmentStudentOption {
  id: number
  userId: string
  fullName: string
  status: 'active' | 'inactive'
}

export interface EnrollmentSubjectOption {
  id: number
  subjectCode: string
  subjectName: string
  status: 'active' | 'inactive'
  section: {
    id: number
    name: string
    status: 'active' | 'inactive'
  }
}

export interface EnrollmentRecord {
  id: number
  student: EnrollmentStudentOption
  educator: EnrollmentStudentOption
  subject: EnrollmentSubjectOption
  status: 'active' | 'inactive'
}

export interface CreateEnrollmentInput {
  studentIds: number[]
  subjectIds: number[]
  status: 'active' | 'inactive'
}

export interface BulkCreateEnrollmentRow {
  studentId: number
  subjectId: number
  status: 'active' | 'inactive'
}

export interface UpdateEnrollmentInput {
  id: number
  studentId: number
  subjectId: number
  status: 'active' | 'inactive'
}

interface UserRow {
  id: number
  user_id: string
  given_name: string
  surname: string
  is_active: boolean
}

interface SectionRow {
  id: number
  section_name: string
  is_active: boolean
}

interface SubjectRow {
  id: number
  subject_code: string
  subject_name: string
  is_active: boolean
  section: SectionRow | SectionRow[] | null
}

interface EnrollmentRow {
  id: number
  is_active: boolean
  student: UserRow | UserRow[] | null
  educator: UserRow | UserRow[] | null
  subject: SubjectRow | SubjectRow[] | null
}

interface UserLookupRow {
  id: number
}

interface SupabaseErrorResponse {
  message?: string
}

interface EnrollmentPairRow {
  id: number
  student_id: number
  subject_id: number
}

// buildEnrollmentNotificationTitle - create a short enrollment notification title
function buildEnrollmentNotificationTitle(action: 'created' | 'updated' | 'deleted') {
  if (action === 'created') {
    return 'New enrollment assigned'
  }

  if (action === 'updated') {
    return 'Enrollment updated'
  }

  return 'Enrollment removed'
}

// buildEnrollmentNotificationMessage - create the enrollment notification message body
function buildEnrollmentNotificationMessage(
  action: 'created' | 'updated' | 'deleted',
  enrollment: EnrollmentRecord
) {
  const subjectLabel = `${enrollment.subject.subjectCode} - ${enrollment.subject.subjectName}`

  if (action === 'created') {
    return `You have been enrolled in ${subjectLabel}.`
  }

  if (action === 'updated' && enrollment.status === 'inactive') {
    return `Your enrollment in ${subjectLabel} is now inactive.`
  }

  if (action === 'updated') {
    return `Your enrollment in ${subjectLabel} has been updated.`
  }

  return `Your enrollment in ${subjectLabel} has been removed.`
}

// getSupabaseErrorMessage - normalize api errors
function getSupabaseErrorMessage(error: SupabaseErrorResponse | null, fallbackMessage: string) {
  return error?.message || fallbackMessage
}

// mapStudentOption - convert db row to student option
function mapStudentOption(student: UserRow): EnrollmentStudentOption {
  return {
    id: student.id,
    userId: student.user_id,
    fullName: `${student.given_name} ${student.surname}`.trim(),
    status: student.is_active ? 'active' : 'inactive',
  }
}

// mapSectionOption - convert db row to section option
function mapSectionOption(section: SectionRow) {
  return {
    id: section.id,
    name: section.section_name,
    status: section.is_active ? 'active' : 'inactive',
  } as const
}

// mapSubjectOption - convert db row to subject option
function mapSubjectOption(subject: SubjectRow): EnrollmentSubjectOption | null {
  const section = Array.isArray(subject.section) ? subject.section[0] : subject.section

  if (!section) {
    return null
  }

  return {
    id: subject.id,
    subjectCode: subject.subject_code,
    subjectName: subject.subject_name,
    status: subject.is_active ? 'active' : 'inactive',
    section: mapSectionOption(section),
  }
}

// mapEnrollmentRecord - convert db row to enrollment record
function mapEnrollmentRecord(row: EnrollmentRow): EnrollmentRecord | null {
  const student = Array.isArray(row.student) ? row.student[0] : row.student
  const educator = Array.isArray(row.educator) ? row.educator[0] : row.educator
  const subject = Array.isArray(row.subject) ? row.subject[0] : row.subject

  if (!student || !educator || !subject) {
    return null
  }

  const mappedSubject = mapSubjectOption(subject)

  if (!mappedSubject) {
    return null
  }

  return {
    id: row.id,
    student: mapStudentOption(student),
    educator: mapStudentOption(educator),
    subject: mappedSubject,
    status: row.is_active ? 'active' : 'inactive',
  }
}

// fetchEnrollmentNotificationContext - load one enrollment row before destructive actions
async function fetchEnrollmentNotificationContext(educatorId: number, enrollmentId: number) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tbl_enrolled')
    .select(
      'id,is_active,student:student_id(id,user_id,given_name,surname,is_active),educator:educator_id(id,user_id,given_name,surname,is_active),subject:subject_id(id,subject_code,subject_name,is_active,section:sections_id(id,section_name,is_active))'
    )
    .eq('id', enrollmentId)
    .eq('educator_id', educatorId)
    .single()

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load enrollment notification details.'))
  }

  const enrollment = mapEnrollmentRecord(data as EnrollmentRow)

  if (!enrollment) {
    throw new Error('Enrollment notification details were not found.')
  }

  return enrollment
}

// notifyStudentAboutEnrollmentChange - save best-effort enrollment notifications
async function notifyStudentAboutEnrollmentChange(
  educatorId: number,
  action: 'created' | 'updated' | 'deleted',
  enrollments: EnrollmentRecord[]
) {
  try {
    const notificationRows: NotificationInsertInput[] = enrollments.map((enrollment) => ({
      recipientUserId: enrollment.student.id,
      actorUserId: educatorId,
      eventType:
        action === 'created'
          ? 'enrollment_created'
          : action === 'updated'
            ? 'enrollment_updated'
            : 'enrollment_deleted',
      title: buildEnrollmentNotificationTitle(action),
      message: buildEnrollmentNotificationMessage(action, enrollment),
      linkPath: '/student/assessment/quiz',
      subjectId: enrollment.subject.id,
      sectionId: enrollment.subject.section.id,
      metadata: {
        subjectName: enrollment.subject.subjectName,
        sectionName: enrollment.subject.section.name,
        enrollmentStatus: enrollment.status,
      },
    }))

    await insertNotifications(notificationRows)
  } catch (error) {
    console.error('Failed to save enrollment notifications.', error)
  }
}

// getCurrentEducatorId - resolve current educator profile id
async function getCurrentEducatorId() {
  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user?.email) {
    throw new Error('Authenticated educator was not found.')
  }

  const { data, error } = await supabase
    .from('tbl_users')
    .select('id')
    .eq('email', user.email)
    .is('deleted_at', null)
    .limit(1)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load educator profile.'))
  }

  const rows = (data || []) as UserLookupRow[]

  if (!rows[0]) {
    throw new Error('Educator profile was not found.')
  }

  return rows[0].id
}

// ensureEnrollmentUniqueness - validate educator enrollment duplicates
async function ensureEnrollmentUniqueness(
  educatorId: number,
  studentIds: number[],
  subjectIds: number[],
  currentEnrollmentId?: number
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tbl_enrolled')
    .select('id,student_id,subject_id')
    .eq('educator_id', educatorId)
    .in('student_id', studentIds)
    .in('subject_id', subjectIds)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to validate enrollment records.'))
  }

  const existingRows = (data || []) as Array<{
    id: number
    student_id: number
    subject_id: number
  }>

  const hasDuplicate = existingRows.some((row) => row.id !== currentEnrollmentId)

  if (hasDuplicate) {
    throw new Error('One or more selected student and subject combinations already exist.')
  }
}

// ensureBulkEnrollmentUniqueness - validate uploaded enrollment rows exactly by pair
async function ensureBulkEnrollmentUniqueness(educatorId: number, rows: BulkCreateEnrollmentRow[]) {
  const requestPairs = rows.map((row) => `${row.studentId}:${row.subjectId}`)
  const duplicateRequestPair = requestPairs.find((pair, index) => requestPairs.indexOf(pair) !== index)

  if (duplicateRequestPair) {
    throw new Error('One or more uploaded student and subject combinations are duplicated.')
  }

  const supabase = createClient()
  const studentIds = [...new Set(rows.map((row) => row.studentId))]
  const subjectIds = [...new Set(rows.map((row) => row.subjectId))]
  const { data, error } = await supabase
    .from('tbl_enrolled')
    .select('id,student_id,subject_id')
    .eq('educator_id', educatorId)
    .in('student_id', studentIds)
    .in('subject_id', subjectIds)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to validate enrollment records.'))
  }

  const existingPairSet = new Set(
    ((data || []) as EnrollmentPairRow[]).map((row) => `${row.student_id}:${row.subject_id}`)
  )
  const hasExistingDuplicate = rows.some((row) => existingPairSet.has(`${row.studentId}:${row.subjectId}`))

  if (hasExistingDuplicate) {
    throw new Error('One or more selected student and subject combinations already exist.')
  }
}

// fetchEnrollmentStudents - load student dropdown options
export async function fetchEnrollmentStudents() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tbl_users')
    .select('id,user_id,given_name,surname,is_active')
    .eq('user_type', 'student')
    .is('deleted_at', null)
    .order('given_name', { ascending: true })

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load students.'))
  }

  return ((data || []) as UserRow[]).map(mapStudentOption)
}

// fetchEnrollmentSubjects - load educator subject dropdown options
export async function fetchEnrollmentSubjects() {
  const educatorId = await getCurrentEducatorId()
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tbl_subjects')
    .select('id,subject_code,subject_name,is_active,section:sections_id(id,section_name,is_active)')
    .eq('educator_id', educatorId)
    .order('subject_name', { ascending: true })

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load subjects.'))
  }

  return ((data || []) as SubjectRow[])
    .map(mapSubjectOption)
    .filter((subject): subject is EnrollmentSubjectOption => Boolean(subject))
}

// fetchEnrollments - load educator enrollment rows
export async function fetchEnrollments() {
  const educatorId = await getCurrentEducatorId()
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tbl_enrolled')
    .select(
      'id,is_active,student:student_id(id,user_id,given_name,surname,is_active),educator:educator_id(id,user_id,given_name,surname,is_active),subject:subject_id(id,subject_code,subject_name,is_active,section:sections_id(id,section_name,is_active))'
    )
    .eq('educator_id', educatorId)
    .order('id', { ascending: false })

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load enrollments.'))
  }

  return ((data || []) as EnrollmentRow[])
    .map(mapEnrollmentRecord)
    .filter((enrollment): enrollment is EnrollmentRecord => Boolean(enrollment))
}

// createEnrollments - create enrollment rows for selected combinations
export async function createEnrollments(input: CreateEnrollmentInput) {
  const educatorId = await getCurrentEducatorId()
  await ensureEnrollmentUniqueness(educatorId, input.studentIds, input.subjectIds)

  const supabase = createClient()
  const rowsToInsert = input.studentIds.flatMap((studentId) =>
    input.subjectIds.map((subjectId) => ({
      student_id: studentId,
      educator_id: educatorId,
      subject_id: subjectId,
      is_active: input.status === 'active',
    }))
  )

  const { data, error } = await supabase
    .from('tbl_enrolled')
    .insert(rowsToInsert)
    .select(
      'id,is_active,student:student_id(id,user_id,given_name,surname,is_active),educator:educator_id(id,user_id,given_name,surname,is_active),subject:subject_id(id,subject_code,subject_name,is_active,section:sections_id(id,section_name,is_active))'
    )

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to create enrollments.'))
  }

  const createdEnrollments = ((data || []) as EnrollmentRow[])
    .map(mapEnrollmentRecord)
    .filter((enrollment): enrollment is EnrollmentRecord => Boolean(enrollment))

  await notifyStudentAboutEnrollmentChange(educatorId, 'created', createdEnrollments)

  return createdEnrollments
}

// createBulkEnrollments - create one enrollment per uploaded row
export async function createBulkEnrollments(rows: BulkCreateEnrollmentRow[]) {
  const educatorId = await getCurrentEducatorId()
  await ensureBulkEnrollmentUniqueness(educatorId, rows)

  const supabase = createClient()
  const rowsToInsert = rows.map((row) => ({
    student_id: row.studentId,
    educator_id: educatorId,
    subject_id: row.subjectId,
    is_active: row.status === 'active',
  }))

  const { data, error } = await supabase
    .from('tbl_enrolled')
    .insert(rowsToInsert)
    .select(
      'id,is_active,student:student_id(id,user_id,given_name,surname,is_active),educator:educator_id(id,user_id,given_name,surname,is_active),subject:subject_id(id,subject_code,subject_name,is_active,section:sections_id(id,section_name,is_active))'
    )

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to create enrollments.'))
  }

  const createdEnrollments = ((data || []) as EnrollmentRow[])
    .map(mapEnrollmentRecord)
    .filter((enrollment): enrollment is EnrollmentRecord => Boolean(enrollment))

  await notifyStudentAboutEnrollmentChange(educatorId, 'created', createdEnrollments)

  return createdEnrollments
}

// updateEnrollment - update a single enrollment row
export async function updateEnrollment(input: UpdateEnrollmentInput) {
  const educatorId = await getCurrentEducatorId()
  await ensureEnrollmentUniqueness(educatorId, [input.studentId], [input.subjectId], input.id)

  const supabase = createClient()
  const { data, error } = await supabase
    .from('tbl_enrolled')
    .update({
      student_id: input.studentId,
      subject_id: input.subjectId,
      is_active: input.status === 'active',
    })
    .eq('id', input.id)
    .eq('educator_id', educatorId)
    .select(
      'id,is_active,student:student_id(id,user_id,given_name,surname,is_active),educator:educator_id(id,user_id,given_name,surname,is_active),subject:subject_id(id,subject_code,subject_name,is_active,section:sections_id(id,section_name,is_active))'
    )
    .single()

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to update enrollment.'))
  }

  const enrollment = mapEnrollmentRecord(data as EnrollmentRow)

  if (!enrollment) {
    throw new Error('Updated enrollment was not found.')
  }

  await notifyStudentAboutEnrollmentChange(educatorId, 'updated', [enrollment])

  return enrollment
}

// deleteEnrollment - remove a single enrollment row
export async function deleteEnrollment(id: number) {
  const educatorId = await getCurrentEducatorId()
  const notificationContext = await fetchEnrollmentNotificationContext(educatorId, id)
  const supabase = createClient()
  const { error } = await supabase
    .from('tbl_enrolled')
    .delete()
    .eq('id', id)
    .eq('educator_id', educatorId)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to delete enrollment.'))
  }

  await notifyStudentAboutEnrollmentChange(educatorId, 'deleted', [notificationContext])
}
