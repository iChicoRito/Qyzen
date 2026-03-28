'use client'

import { createClient } from './client'

export interface SubjectSectionOption {
  id: number
  name: string
  status: 'active' | 'inactive'
}

export interface SubjectRecord {
  id: number
  rowIds: number[]
  subjectCode: string
  subjectName: string
  status: 'active' | 'inactive'
  sections: SubjectSectionOption[]
}

export interface SubjectCreateInput {
  subjectCode: string
  subjectName: string
  sectionIds: number[]
  status: 'active' | 'inactive'
}

export interface SubjectUpdateInput extends SubjectCreateInput {
  rowIds: number[]
}

interface SubjectRow {
  id: number
  subject_code: string
  subject_name: string
  is_active: boolean
  section: SectionRow | SectionRow[] | null
}

interface SectionRow {
  id: number
  section_name: string
  is_active: boolean
}

interface UserRow {
  id: number
}

interface SupabaseErrorResponse {
  code?: string
  message?: string
}

// getSupabaseErrorMessage - normalize api errors
function getSupabaseErrorMessage(error: SupabaseErrorResponse | null, fallbackMessage: string) {
  return error?.message || fallbackMessage
}

// mapSectionOption - convert section row to option
function mapSectionOption(section: SectionRow): SubjectSectionOption {
  return {
    id: section.id,
    name: section.section_name,
    status: section.is_active ? 'active' : 'inactive',
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

// ensureUniqueSubjectsPerSection - validate subject uniqueness per section
async function ensureUniqueSubjectsPerSection(
  educatorId: number,
  input: SubjectCreateInput | SubjectUpdateInput
) {
  const supabase = createClient()
  const currentRowIds = 'rowIds' in input ? input.rowIds : []
  const normalizedSubjectCode = input.subjectCode.trim()
  const normalizedSubjectName = input.subjectName.trim()

  const { data, error } = await supabase
    .from('tbl_subjects')
    .select('id,sections_id,subject_code,subject_name')
    .eq('educator_id', educatorId)
    .in('sections_id', input.sectionIds)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to validate subject uniqueness.'))
  }

  const conflictingRow = ((data || []) as Array<{
    id: number
    sections_id: number
    subject_code: string
    subject_name: string
  }>).find((row) => {
    if (currentRowIds.includes(row.id)) {
      return false
    }

    return (
      row.subject_code.trim().toLowerCase() === normalizedSubjectCode.toLowerCase() ||
      row.subject_name.trim().toLowerCase() === normalizedSubjectName.toLowerCase()
    )
  })

  if (conflictingRow) {
    throw new Error('Subject code or subject name already exists in one of the selected sections.')
  }
}

// fetchSubjectSections - load educator sections for subject options
export async function fetchSubjectSections() {
  const educatorId = await getCurrentEducatorId()
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tbl_sections')
    .select('id,section_name,is_active')
    .eq('educator_id', educatorId)
    .order('section_name', { ascending: true })

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load sections.'))
  }

  return ((data || []) as SectionRow[]).map(mapSectionOption)
}

// fetchSubjects - load educator subjects grouped by code and name
export async function fetchSubjects() {
  const educatorId = await getCurrentEducatorId()
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tbl_subjects')
    .select('id,subject_code,subject_name,is_active,section:sections_id(id,section_name,is_active)')
    .eq('educator_id', educatorId)
    .order('subject_code', { ascending: true })

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load subjects.'))
  }

  const groupedSubjects = new Map<string, SubjectRecord>()

  ;((data || []) as SubjectRow[]).forEach((row) => {
    const section = Array.isArray(row.section) ? row.section[0] : row.section

    if (!section) {
      return
    }

    const groupKey = `${row.subject_code}::${row.subject_name}::${row.is_active}`
    const existingSubject = groupedSubjects.get(groupKey)

    if (!existingSubject) {
      groupedSubjects.set(groupKey, {
        id: row.id,
        rowIds: [row.id],
        subjectCode: row.subject_code,
        subjectName: row.subject_name,
        status: row.is_active ? 'active' : 'inactive',
        sections: [mapSectionOption(section)],
      })
      return
    }

    existingSubject.rowIds.push(row.id)

    if (!existingSubject.sections.some((existingSection) => existingSection.id === section.id)) {
      existingSubject.sections.push(mapSectionOption(section))
    }
  })

  return Array.from(groupedSubjects.values())
}

// createSubject - create subject rows for selected sections
export async function createSubject(input: SubjectCreateInput) {
  const educatorId = await getCurrentEducatorId()
  await ensureUniqueSubjectsPerSection(educatorId, input)

  const supabase = createClient()
  const rowsToInsert = input.sectionIds.map((sectionId) => ({
    educator_id: educatorId,
    sections_id: sectionId,
    subject_code: input.subjectCode.trim(),
    subject_name: input.subjectName.trim(),
    is_active: input.status === 'active',
  }))

  const { data, error } = await supabase
    .from('tbl_subjects')
    .insert(rowsToInsert)
    .select('id,subject_code,subject_name,is_active,section:sections_id(id,section_name,is_active)')

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to create subject.'))
  }

  const insertedRows = (data || []) as SubjectRow[]
  const sections = insertedRows
    .map((row) => (Array.isArray(row.section) ? row.section[0] : row.section))
    .filter((section): section is SectionRow => Boolean(section))
    .map(mapSectionOption)

  return {
    id: insertedRows[0]?.id || 0,
    rowIds: insertedRows.map((row) => row.id),
    subjectCode: input.subjectCode.trim(),
    subjectName: input.subjectName.trim(),
    status: input.status,
    sections,
  } satisfies SubjectRecord
}

// updateSubject - replace grouped subject rows
export async function updateSubject(input: SubjectUpdateInput) {
  const educatorId = await getCurrentEducatorId()
  await ensureUniqueSubjectsPerSection(educatorId, input)

  const supabase = createClient()
  const { error: deleteError } = await supabase
    .from('tbl_subjects')
    .delete()
    .eq('educator_id', educatorId)
    .in('id', input.rowIds)

  if (deleteError) {
    throw new Error(getSupabaseErrorMessage(deleteError, 'Failed to update subject rows.'))
  }

  return createSubject({
    subjectCode: input.subjectCode,
    subjectName: input.subjectName,
    sectionIds: input.sectionIds,
    status: input.status,
  })
}

// deleteSubject - remove grouped subject rows
export async function deleteSubject(rowIds: number[]) {
  const educatorId = await getCurrentEducatorId()
  const supabase = createClient()
  const { error } = await supabase
    .from('tbl_subjects')
    .delete()
    .eq('educator_id', educatorId)
    .in('id', rowIds)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to delete subject.'))
  }
}
