'use client'

import type { NotificationInsertInput } from '@/types/notification'

import { fetchActiveStudentRecipientIds, insertNotifications } from './notifications'
import { createClient } from './client'

export interface AssessmentSubjectOption {
  subjectId: number
  sectionId: number
  subjectCode: string
  subjectName: string
  sectionName: string
  termSummary: string
  status: 'active' | 'inactive'
  academicTerms: AcademicTermOption[]
}

export interface AcademicTermOption {
  id: number
  name: string
  semester: string
  label: string
}

export interface AssessmentRecord {
  id: number
  assessmentId: string
  assessmentCode: string
  termId: number
  termName: string
  subjectId: number
  subjectName: string
  sectionId: number
  sectionName: string
  timeLimit: string
  cheatingAttempts: number
  isShuffle: boolean
  allowReview: boolean
  allowRetake: boolean
  retakeCount: number
  allowHint: boolean
  hintCount: number
  status: 'active' | 'inactive'
  startDate: string
  endDate: string
  startTime: string
  endTime: string
}

export interface AssessmentCreateInput {
  assessmentCode: string
  selections: AssessmentSubjectOption[]
  academicTermId: number
  timeLimit: string
  cheatingAttempts?: number
  isShuffle: boolean
  allowReview: boolean
  allowRetake: boolean
  retakeCount?: number
  allowHint: boolean
  hintCount?: number
  status: 'active' | 'inactive'
  startDate: string
  endDate: string
  startTime: string
  endTime: string
}

export interface AssessmentUpdateInput {
  id: number
  assessmentCode: string
  selection: AssessmentSubjectOption
  academicTermId: number
  timeLimit: string
  cheatingAttempts?: number
  isShuffle: boolean
  allowReview: boolean
  allowRetake: boolean
  retakeCount?: number
  allowHint: boolean
  hintCount?: number
  status: 'active' | 'inactive'
  startDate: string
  endDate: string
  startTime: string
  endTime: string
}

interface DeletedAssessmentRow {
  id: number
}

interface UserRow {
  id: number
}

interface SubjectRow {
  id: number
  subject_code: string
  subject_name: string
  is_active: boolean
  sections_id: number
  section: SectionRow | SectionRow[] | null
}

interface SectionRow {
  id: number
  section_name: string
}

interface SectionTermRow {
  section_id: number
  term: TermRow | TermRow[] | null
}

interface TermRow {
  id: number
  term_name: string
  semester: string
}

interface AssessmentRow {
  id: number
  assessment_code: string
  term: number
  subject_id: number
  section_id: number
  time_limit: string
  cheating_attempts: number
  is_shuffle: boolean
  allow_review: boolean
  allow_retake: boolean
  retake_count: number
  allow_hint: boolean
  hint_count: number
  is_active: boolean
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  academic_term: TermRow | TermRow[] | null
  subject: SubjectNameRow | SubjectNameRow[] | null
  section: SectionRow | SectionRow[] | null
}

interface SubjectNameRow {
  subject_name: string
}

interface AssessmentNotificationContext {
  id: number
  assessmentCode: string
  subjectId: number
  subjectName: string
  sectionId: number
  sectionName: string
}

interface SupabaseErrorResponse {
  message?: string
}

// normalizeAssessmentTimeValue - keep stored time values compatible with time inputs
function normalizeAssessmentTimeValue(value: string) {
  return value.length >= 5 ? value.slice(0, 5) : value
}

// getSupabaseErrorMessage - normalize api errors
function getSupabaseErrorMessage(error: SupabaseErrorResponse | null, fallbackMessage: string) {
  return error?.message || fallbackMessage
}

// buildAcademicTermLabel - format academic term label
function buildAcademicTermLabel(term: TermRow) {
  return `${term.term_name} - ${term.semester}`
}

// getAssessmentNotificationEventType - map assessment actions into notification events
function getAssessmentNotificationEventType(action: 'created' | 'updated' | 'deleted') {
  if (action === 'created') {
    return 'assessment_created' as const
  }

  if (action === 'updated') {
    return 'assessment_updated' as const
  }

  return 'assessment_deleted' as const
}

// buildAssessmentNotificationTitle - create a short notification title
function buildAssessmentNotificationTitle(action: 'created' | 'updated' | 'deleted') {
  if (action === 'created') {
    return 'New assessment available'
  }

  if (action === 'updated') {
    return 'Assessment updated'
  }

  return 'Assessment removed'
}

// buildAssessmentNotificationMessage - create the assessment notification message body
function buildAssessmentNotificationMessage(
  action: 'created' | 'updated' | 'deleted',
  context: AssessmentNotificationContext
) {
  if (action === 'created') {
    return `${context.assessmentCode} for ${context.subjectName} in ${context.sectionName} is now available.`
  }

  if (action === 'updated') {
    return `${context.assessmentCode} for ${context.subjectName} in ${context.sectionName} has been updated.`
  }

  return `${context.assessmentCode} for ${context.subjectName} in ${context.sectionName} is no longer available.`
}

// fetchAssessmentNotificationContext - load one assessment context for notification messages
async function fetchAssessmentNotificationContext(assessmentId: number, educatorId: number) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tbl_assessments')
    .select('id,assessment_code,subject_id,section_id,subject:subject_id(subject_name),section:section_id(section_name)')
    .eq('educator_id', educatorId)
    .eq('id', assessmentId)
    .single()

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load assessment notification details.'))
  }

  const row = data as AssessmentRow
  const subject = Array.isArray(row.subject) ? row.subject[0] : row.subject
  const section = Array.isArray(row.section) ? row.section[0] : row.section

  return {
    id: row.id,
    assessmentCode: row.assessment_code,
    subjectId: row.subject_id,
    subjectName: subject?.subject_name || 'Unknown Subject',
    sectionId: row.section_id,
    sectionName: section?.section_name || 'Unknown Section',
  } satisfies AssessmentNotificationContext
}

// createAssessmentNotificationInputs - build notification rows for active enrolled students
async function createAssessmentNotificationInputs(
  educatorId: number,
  action: 'created' | 'updated' | 'deleted',
  contexts: AssessmentNotificationContext[]
) {
  const notificationRows: NotificationInsertInput[] = []

  for (const context of contexts) {
    const recipientUserIds = await fetchActiveStudentRecipientIds(educatorId, context.subjectId)

    recipientUserIds.forEach((recipientUserId) => {
      notificationRows.push({
        recipientUserId,
        actorUserId: educatorId,
        eventType: getAssessmentNotificationEventType(action),
        title: buildAssessmentNotificationTitle(action),
        message: buildAssessmentNotificationMessage(action, context),
        linkPath: '/student/assessment/quiz',
        assessmentId: action === 'deleted' ? null : context.id,
        subjectId: context.subjectId,
        sectionId: context.sectionId,
        metadata: {
          assessmentCode: context.assessmentCode,
          subjectName: context.subjectName,
          sectionName: context.sectionName,
        },
      })
    })
  }

  return notificationRows
}

// notifyStudentsAboutAssessmentChange - save best-effort assessment notifications
async function notifyStudentsAboutAssessmentChange(
  educatorId: number,
  action: 'created' | 'updated' | 'deleted',
  contexts: AssessmentNotificationContext[]
) {
  try {
    const notificationRows = await createAssessmentNotificationInputs(educatorId, action, contexts)
    await insertNotifications(notificationRows)
  } catch (error) {
    console.error('Failed to save assessment notifications.', error)
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

  const rows = (data || []) as UserRow[]

  if (!rows[0]) {
    throw new Error('Educator profile was not found.')
  }

  return rows[0].id
}

// fetchSectionTermMap - load term options by section
async function fetchSectionTermMap(sectionIds: number[]) {
  if (sectionIds.length === 0) {
    return new Map<number, AcademicTermOption[]>()
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('tbl_sections_term')
    .select('section_id,term:academic_term_id(id,term_name,semester)')
    .in('section_id', sectionIds)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load section terms.'))
  }

  const termMap = new Map<number, AcademicTermOption[]>()

  ;((data || []) as SectionTermRow[]).forEach((row) => {
    const termValue = Array.isArray(row.term) ? row.term[0] : row.term

    if (!termValue?.term_name) {
      return
    }

    const currentTerms = termMap.get(row.section_id) || []

    if (!currentTerms.some((currentTerm) => currentTerm.id === termValue.id)) {
      termMap.set(row.section_id, [
        ...currentTerms,
        {
          id: termValue.id,
          name: termValue.term_name,
          semester: termValue.semester,
          label: buildAcademicTermLabel(termValue),
        },
      ])
    }
  })

  return termMap
}

// ensureUniqueAssessmentCodes - validate assessment uniqueness per selected subject and section
async function ensureUniqueAssessmentCodes(
  educatorId: number,
  normalizedAssessmentCode: string,
  selections: AssessmentSubjectOption[],
  academicTermId: number,
  currentAssessmentId?: number
) {
  const supabase = createClient()
  const subjectIds = selections.map((selection) => selection.subjectId)
  const sectionIds = selections.map((selection) => selection.sectionId)
  const { data, error } = await supabase
    .from('tbl_assessments')
    .select('id,subject_id,section_id,term,assessment_code')
    .eq('educator_id', educatorId)
    .eq('assessment_code', normalizedAssessmentCode)
    .eq('term', academicTermId)
    .in('subject_id', subjectIds)
    .in('section_id', sectionIds)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to validate assessment code uniqueness.'))
  }

  const conflict = ((data || []) as Array<{
    id: number
    subject_id: number
    section_id: number
    term: number
    assessment_code: string
  }>).find((row) =>
    row.id !== currentAssessmentId &&
    row.term === academicTermId &&
    selections.some(
      (selection) =>
        selection.subjectId === row.subject_id && selection.sectionId === row.section_id
    )
  )

  if (conflict) {
    throw new Error('Only one assessment code can be created per subject, section, and term.')
  }
}

// fetchAssessmentSubjectOptions - load educator subject and section options
export async function fetchAssessmentSubjectOptions() {
  const educatorId = await getCurrentEducatorId()
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tbl_subjects')
    .select('id,subject_code,subject_name,is_active,sections_id,section:sections_id(id,section_name)')
    .eq('educator_id', educatorId)
    .order('subject_name', { ascending: true })

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load assessment subject options.'))
  }

  const subjectRows = (data || []) as SubjectRow[]
  const sectionIds = subjectRows.map((row) => row.sections_id)
  const termMap = await fetchSectionTermMap(sectionIds)

  return subjectRows
    .map((row) => {
      const section = Array.isArray(row.section) ? row.section[0] : row.section

      if (!section) {
        return null
      }

      return {
        subjectId: row.id,
        sectionId: row.sections_id,
        subjectCode: row.subject_code,
        subjectName: row.subject_name,
        sectionName: section.section_name,
        termSummary:
          termMap.get(row.sections_id)?.map((term) => term.label).join(', ') || 'No term',
        status: row.is_active ? 'active' : 'inactive',
        academicTerms: termMap.get(row.sections_id) || [],
      } satisfies AssessmentSubjectOption
    })
    .filter((value): value is AssessmentSubjectOption => Boolean(value))
}

// fetchAssessments - load educator assessment rows
export async function fetchAssessments() {
  const educatorId = await getCurrentEducatorId()
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tbl_assessments')
    .select(
      'id,assessment_code,term,subject_id,section_id,time_limit,cheating_attempts,is_shuffle,allow_review,allow_retake,retake_count,allow_hint,hint_count,is_active,start_date,end_date,start_time,end_time,academic_term:term(id,term_name,semester),subject:subject_id(subject_name),section:section_id(id,section_name)'
    )
    .eq('educator_id', educatorId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load assessments.'))
  }

  const assessmentRows = (data || []) as AssessmentRow[]
  return assessmentRows.map((row) => {
    const subject = Array.isArray(row.subject) ? row.subject[0] : row.subject
    const section = Array.isArray(row.section) ? row.section[0] : row.section
    const academicTerm = Array.isArray(row.academic_term) ? row.academic_term[0] : row.academic_term

    return {
      id: row.id,
      assessmentId: row.assessment_code,
      assessmentCode: row.assessment_code,
      termId: row.term,
      termName: academicTerm ? buildAcademicTermLabel(academicTerm) : 'No term',
      subjectId: row.subject_id,
      subjectName: subject?.subject_name || 'Unknown Subject',
      sectionId: row.section_id,
      sectionName: section?.section_name || 'Unknown Section',
      timeLimit: row.time_limit,
      cheatingAttempts: row.cheating_attempts,
      isShuffle: row.is_shuffle,
      allowReview: row.allow_review,
      allowRetake: row.allow_retake,
      retakeCount: row.retake_count,
      allowHint: row.allow_hint,
      hintCount: row.hint_count,
      status: row.is_active ? 'active' : 'inactive',
      startDate: row.start_date,
      endDate: row.end_date,
      startTime: normalizeAssessmentTimeValue(row.start_time),
      endTime: normalizeAssessmentTimeValue(row.end_time),
    } satisfies AssessmentRecord
  })
}

// createAssessments - create one assessment row per selected subject
export async function createAssessments(input: AssessmentCreateInput) {
  const educatorId = await getCurrentEducatorId()
  const normalizedAssessmentCode = input.assessmentCode.trim()

  await ensureUniqueAssessmentCodes(
    educatorId,
    normalizedAssessmentCode,
    input.selections,
    input.academicTermId
  )

  const supabase = createClient()
  const rowsToInsert = input.selections.map((selection) => ({
    educator_id: educatorId,
    subject_id: selection.subjectId,
    section_id: selection.sectionId,
    assessment_code: normalizedAssessmentCode,
    term: input.academicTermId,
    time_limit: input.timeLimit.trim(),
    cheating_attempts: input.cheatingAttempts ?? 0,
    is_shuffle: input.isShuffle,
    allow_review: input.allowReview,
    allow_retake: input.allowRetake,
    retake_count: input.allowRetake ? input.retakeCount ?? 0 : 0,
    allow_hint: input.allowHint,
    hint_count: input.allowHint ? input.hintCount ?? 0 : 0,
    is_active: input.status === 'active',
    start_date: input.startDate,
    end_date: input.endDate,
    start_time: input.startTime,
    end_time: input.endTime,
  }))

  const { data, error } = await supabase
    .from('tbl_assessments')
    .insert(rowsToInsert)
    .select(
      'id,assessment_code,term,subject_id,section_id,time_limit,cheating_attempts,is_shuffle,allow_review,allow_retake,retake_count,allow_hint,hint_count,is_active,start_date,end_date,start_time,end_time'
    )

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to create assessments.'))
  }

  const selectionMap = new Map(
    input.selections.map((selection) => [`${selection.subjectId}:${selection.sectionId}`, selection])
  )

  const createdAssessmentRecords = ((data || []) as AssessmentRow[]).map((row) => {
    const selection = selectionMap.get(`${row.subject_id}:${row.section_id}`)

    if (!selection) {
      throw new Error('Created assessment row could not be matched to the selected subject.')
    }

    return {
      id: row.id,
      assessmentId: row.assessment_code,
      assessmentCode: row.assessment_code,
      termId: row.term,
      termName:
        selection.academicTerms.find((term) => term.id === input.academicTermId)?.label || 'No term',
      subjectId: row.subject_id,
      subjectName: selection.subjectName,
      sectionId: row.section_id,
      sectionName: selection.sectionName,
      timeLimit: row.time_limit,
      cheatingAttempts: row.cheating_attempts,
      isShuffle: row.is_shuffle,
      allowReview: row.allow_review,
      allowRetake: row.allow_retake,
      retakeCount: row.retake_count,
      allowHint: row.allow_hint,
      hintCount: row.hint_count,
      status: row.is_active ? 'active' : 'inactive',
      startDate: row.start_date,
      endDate: row.end_date,
      startTime: normalizeAssessmentTimeValue(row.start_time),
      endTime: normalizeAssessmentTimeValue(row.end_time),
    } satisfies AssessmentRecord
  })

  await notifyStudentsAboutAssessmentChange(
    educatorId,
    'created',
    createdAssessmentRecords.map((record) => ({
      id: record.id,
      assessmentCode: record.assessmentCode,
      subjectId: record.subjectId,
      subjectName: record.subjectName,
      sectionId: record.sectionId,
      sectionName: record.sectionName,
    }))
  )

  return createdAssessmentRecords
}

// updateAssessment - update one assessment row
export async function updateAssessment(input: AssessmentUpdateInput) {
  const educatorId = await getCurrentEducatorId()
  const normalizedAssessmentCode = input.assessmentCode.trim()

  await ensureUniqueAssessmentCodes(
    educatorId,
    normalizedAssessmentCode,
    [input.selection],
    input.academicTermId,
    input.id
  )

  const supabase = createClient()
  const { data, error } = await supabase
    .from('tbl_assessments')
    .update({
      subject_id: input.selection.subjectId,
      section_id: input.selection.sectionId,
      assessment_code: normalizedAssessmentCode,
      term: input.academicTermId,
      time_limit: input.timeLimit.trim(),
      cheating_attempts: input.cheatingAttempts ?? 0,
      is_shuffle: input.isShuffle,
      allow_review: input.allowReview,
      allow_retake: input.allowRetake,
      retake_count: input.allowRetake ? input.retakeCount ?? 0 : 0,
      allow_hint: input.allowHint,
      hint_count: input.allowHint ? input.hintCount ?? 0 : 0,
      is_active: input.status === 'active',
      start_date: input.startDate,
      end_date: input.endDate,
      start_time: input.startTime,
      end_time: input.endTime,
    })
    .eq('educator_id', educatorId)
    .eq('id', input.id)
    .select(
      'id,assessment_code,term,subject_id,section_id,time_limit,cheating_attempts,is_shuffle,allow_review,allow_retake,retake_count,allow_hint,hint_count,is_active,start_date,end_date,start_time,end_time'
    )

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to update assessment.'))
  }

  const updatedRow = ((data || []) as AssessmentRow[])[0]

  if (!updatedRow) {
    throw new Error('You do not have permission to update this assessment.')
  }

  const updatedAssessmentRecord = {
    id: updatedRow.id,
    assessmentId: updatedRow.assessment_code,
    assessmentCode: updatedRow.assessment_code,
    termId: updatedRow.term,
    termName:
      input.selection.academicTerms.find((term) => term.id === input.academicTermId)?.label || 'No term',
    subjectId: updatedRow.subject_id,
    subjectName: input.selection.subjectName,
    sectionId: updatedRow.section_id,
    sectionName: input.selection.sectionName,
    timeLimit: updatedRow.time_limit,
    cheatingAttempts: updatedRow.cheating_attempts,
    isShuffle: updatedRow.is_shuffle,
    allowReview: updatedRow.allow_review,
    allowRetake: updatedRow.allow_retake,
    retakeCount: updatedRow.retake_count,
    allowHint: updatedRow.allow_hint,
    hintCount: updatedRow.hint_count,
    status: updatedRow.is_active ? 'active' : 'inactive',
    startDate: updatedRow.start_date,
    endDate: updatedRow.end_date,
    startTime: normalizeAssessmentTimeValue(updatedRow.start_time),
    endTime: normalizeAssessmentTimeValue(updatedRow.end_time),
  } satisfies AssessmentRecord

  await notifyStudentsAboutAssessmentChange(educatorId, 'updated', [
    {
      id: updatedAssessmentRecord.id,
      assessmentCode: updatedAssessmentRecord.assessmentCode,
      subjectId: updatedAssessmentRecord.subjectId,
      subjectName: updatedAssessmentRecord.subjectName,
      sectionId: updatedAssessmentRecord.sectionId,
      sectionName: updatedAssessmentRecord.sectionName,
    },
  ])

  return updatedAssessmentRecord
}

// deleteAssessment - remove one assessment row
export async function deleteAssessment(assessmentId: number) {
  const educatorId = await getCurrentEducatorId()
  const notificationContext = await fetchAssessmentNotificationContext(assessmentId, educatorId)
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tbl_assessments')
    .delete()
    .eq('educator_id', educatorId)
    .eq('id', assessmentId)
    .select('id')

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to delete assessment.'))
  }

  const deletedRows = (data || []) as DeletedAssessmentRow[]

  if (deletedRows.length === 0) {
    throw new Error('You do not have permission to delete this assessment.')
  }

  await notifyStudentsAboutAssessmentChange(educatorId, 'deleted', [notificationContext])
}

