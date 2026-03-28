'use client'

import { createClient } from './client'

export interface SectionRecord {
  id: number
  sectionName: string
  status: 'active' | 'inactive'
  academicTerms: Array<{
    id: number
    name: string
    semester: string
    label: string
  }>
}

export interface SectionCreateInput {
  sectionName: string
  academicTermIds: number[]
  status: 'active' | 'inactive'
}

export interface SectionUpdateInput extends SectionCreateInput {
  id: number
}

export interface AcademicTermOption {
  id: number
  name: string
  semester: string
  label: string
}

interface SectionRow {
  id: number
  section_name: string
  is_active: boolean
}

interface SectionTermRow {
  academic_term: AcademicTermRow | AcademicTermRow[] | null
}

interface AcademicTermRow {
  id: number
  term_name: string
  semester: string
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

// buildAcademicTermLabel - format academic term label
function buildAcademicTermLabel(term: AcademicTermRow) {
  return `${term.term_name} - ${term.semester}`
}

// mapAcademicTermOption - convert academic term row
function mapAcademicTermOption(term: AcademicTermRow): AcademicTermOption {
  return {
    id: term.id,
    name: term.term_name,
    semester: term.semester,
    label: buildAcademicTermLabel(term),
  }
}

// mapSectionRecord - convert db rows to section record
function mapSectionRecord(section: SectionRow, sectionTerms: SectionTermRow[]): SectionRecord {
  const academicTerms = sectionTerms
    .map((sectionTerm) =>
      Array.isArray(sectionTerm.academic_term) ? sectionTerm.academic_term[0] : sectionTerm.academic_term
    )
    .filter((term): term is AcademicTermRow => Boolean(term))
    .map(mapAcademicTermOption)

  return {
    id: section.id,
    sectionName: section.section_name,
    status: section.is_active ? 'active' : 'inactive',
    academicTerms,
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

// ensureUniqueSectionTerms - check duplicate section names per term
async function ensureUniqueSectionTerms(
  educatorId: number,
  sectionName: string,
  academicTermIds: number[],
  currentSectionId?: number
) {
  const supabase = createClient()
  const normalizedSectionName = sectionName.trim()
  const { data, error } = await supabase
    .from('tbl_sections')
    .select('id,section_name,section_terms:tbl_sections_term(academic_term_id)')
    .eq('educator_id', educatorId)
    .eq('section_name', normalizedSectionName)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to validate section uniqueness.'))
  }

  const duplicateTermIds = ((data || []) as Array<{
    id: number
    section_name: string
    section_terms: Array<{ academic_term_id: number }>
  }>)
    .filter((section) => section.id !== currentSectionId)
    .flatMap((section) => section.section_terms.map((sectionTerm) => sectionTerm.academic_term_id))

  const conflictingTermId = academicTermIds.find((termId) => duplicateTermIds.includes(termId))

  if (conflictingTermId) {
    throw new Error('Section name already exists in one of the selected academic terms.')
  }
}

// fetchSectionAcademicTerms - load academic term options
export async function fetchSectionAcademicTerms() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tbl_academic_term')
    .select('id,term_name,semester')
    .eq('is_active', true)
    .order('id', { ascending: false })

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load academic terms.'))
  }

  return ((data || []) as AcademicTermRow[]).map(mapAcademicTermOption)
}

// fetchSections - load educator sections with terms
export async function fetchSections() {
  const educatorId = await getCurrentEducatorId()
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tbl_sections')
    .select(
      'id,section_name,is_active,section_terms:tbl_sections_term(academic_term:academic_term_id(id,term_name,semester))'
    )
    .eq('educator_id', educatorId)
    .order('id', { ascending: false })

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load sections.'))
  }

  return ((data || []) as Array<SectionRow & { section_terms: SectionTermRow[] }>).map((section) =>
    mapSectionRecord(section, section.section_terms)
  )
}

// createSection - insert section row and term assignments
export async function createSection(input: SectionCreateInput) {
  const educatorId = await getCurrentEducatorId()
  await ensureUniqueSectionTerms(educatorId, input.sectionName, input.academicTermIds)

  const supabase = createClient()
  const primaryAcademicTermId = input.academicTermIds[0]
  const { data, error } = await supabase
    .from('tbl_sections')
    .insert({
      educator_id: educatorId,
      academic_term_id: primaryAcademicTermId,
      section_name: input.sectionName.trim(),
      is_active: input.status === 'active',
    })
    .select('id,section_name,is_active')
    .single()

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to create section.'))
  }

  const section = data as SectionRow
  const { error: sectionTermsError } = await supabase.from('tbl_sections_term').insert(
    input.academicTermIds.map((academicTermId) => ({
      section_id: section.id,
      academic_term_id: academicTermId,
    }))
  )

  if (sectionTermsError) {
    throw new Error(getSupabaseErrorMessage(sectionTermsError, 'Failed to assign academic terms.'))
  }

  const academicTerms = await fetchSectionAcademicTerms()

  return {
    id: section.id,
    sectionName: section.section_name,
    status: section.is_active ? 'active' : 'inactive',
    academicTerms: academicTerms.filter((term) => input.academicTermIds.includes(term.id)),
  } as SectionRecord
}

// updateSection - update section row and term assignments
export async function updateSection(input: SectionUpdateInput) {
  const educatorId = await getCurrentEducatorId()
  await ensureUniqueSectionTerms(educatorId, input.sectionName, input.academicTermIds, input.id)

  const supabase = createClient()
  const primaryAcademicTermId = input.academicTermIds[0]
  const { error: updateError } = await supabase
    .from('tbl_sections')
    .update({
      academic_term_id: primaryAcademicTermId,
      section_name: input.sectionName.trim(),
      is_active: input.status === 'active',
    })
    .eq('id', input.id)
    .eq('educator_id', educatorId)

  if (updateError) {
    throw new Error(getSupabaseErrorMessage(updateError, 'Failed to update section.'))
  }

  const { error: deleteTermsError } = await supabase
    .from('tbl_sections_term')
    .delete()
    .eq('section_id', input.id)

  if (deleteTermsError) {
    throw new Error(getSupabaseErrorMessage(deleteTermsError, 'Failed to reset section terms.'))
  }

  const { error: insertTermsError } = await supabase.from('tbl_sections_term').insert(
    input.academicTermIds.map((academicTermId) => ({
      section_id: input.id,
      academic_term_id: academicTermId,
    }))
  )

  if (insertTermsError) {
    throw new Error(getSupabaseErrorMessage(insertTermsError, 'Failed to save section terms.'))
  }

  const academicTerms = await fetchSectionAcademicTerms()

  return {
    id: input.id,
    sectionName: input.sectionName.trim(),
    status: input.status,
    academicTerms: academicTerms.filter((term) => input.academicTermIds.includes(term.id)),
  } as SectionRecord
}

// deleteSection - remove section row and related term links
export async function deleteSection(sectionId: number) {
  const educatorId = await getCurrentEducatorId()
  const supabase = createClient()
  const { error } = await supabase
    .from('tbl_sections')
    .delete()
    .eq('id', sectionId)
    .eq('educator_id', educatorId)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to delete section.'))
  }
}
