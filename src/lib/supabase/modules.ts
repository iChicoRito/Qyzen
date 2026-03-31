'use client'

import { createClient } from './client'

export interface ModuleSubjectOption {
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

export interface ModuleRecord {
  id: number
  moduleId: string
  moduleCode: string
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
  allowHint: boolean
  hintCount: number
  status: 'active' | 'inactive'
  startDate: string
  endDate: string
  startTime: string
  endTime: string
}

export interface ModuleCreateInput {
  moduleCode: string
  selections: ModuleSubjectOption[]
  academicTermId: number
  timeLimit: string
  cheatingAttempts?: number
  isShuffle: boolean
  allowReview: boolean
  allowHint: boolean
  hintCount?: number
  status: 'active' | 'inactive'
  startDate: string
  endDate: string
  startTime: string
  endTime: string
}

export interface ModuleUpdateInput {
  id: number
  moduleCode: string
  selection: ModuleSubjectOption
  academicTermId: number
  timeLimit: string
  cheatingAttempts?: number
  isShuffle: boolean
  allowReview: boolean
  allowHint: boolean
  hintCount?: number
  status: 'active' | 'inactive'
  startDate: string
  endDate: string
  startTime: string
  endTime: string
}

interface DeletedModuleRow {
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

interface ModuleRow {
  id: number
  module_id: string
  module_code: string
  term: number
  subject_id: number
  section_id: number
  time_limit: string
  cheating_attempts: number
  is_shuffle: boolean
  allow_review: boolean
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

interface SupabaseErrorResponse {
  message?: string
}

// getSupabaseErrorMessage - normalize api errors
function getSupabaseErrorMessage(error: SupabaseErrorResponse | null, fallbackMessage: string) {
  return error?.message || fallbackMessage
}

// buildAcademicTermLabel - format academic term label
function buildAcademicTermLabel(term: TermRow) {
  return `${term.term_name} - ${term.semester}`
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

// ensureUniqueModuleCodes - validate module uniqueness per selected subject and section
async function ensureUniqueModuleCodes(
  educatorId: number,
  normalizedModuleCode: string,
  selections: ModuleSubjectOption[],
  academicTermId: number,
  currentModuleId?: number
) {
  const supabase = createClient()
  const subjectIds = selections.map((selection) => selection.subjectId)
  const sectionIds = selections.map((selection) => selection.sectionId)
  const { data, error } = await supabase
    .from('tbl_modules')
    .select('id,subject_id,section_id,term,module_code')
    .eq('educator_id', educatorId)
    .eq('module_code', normalizedModuleCode)
    .eq('term', academicTermId)
    .in('subject_id', subjectIds)
    .in('section_id', sectionIds)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to validate module code uniqueness.'))
  }

  const conflict = ((data || []) as Array<{
    id: number
    subject_id: number
    section_id: number
    term: number
    module_code: string
  }>).find((row) =>
    row.id !== currentModuleId &&
    row.term === academicTermId &&
    selections.some(
      (selection) =>
        selection.subjectId === row.subject_id && selection.sectionId === row.section_id
    )
  )

  if (conflict) {
    throw new Error('Only one module code can be created per subject, section, and term.')
  }
}

// fetchModuleSubjectOptions - load educator subject and section options
export async function fetchModuleSubjectOptions() {
  const educatorId = await getCurrentEducatorId()
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tbl_subjects')
    .select('id,subject_code,subject_name,is_active,sections_id,section:sections_id(id,section_name)')
    .eq('educator_id', educatorId)
    .order('subject_name', { ascending: true })

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load module subject options.'))
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
      } satisfies ModuleSubjectOption
    })
    .filter((value): value is ModuleSubjectOption => Boolean(value))
}

// fetchModules - load educator module rows
export async function fetchModules() {
  const educatorId = await getCurrentEducatorId()
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tbl_modules')
    .select(
      'id,module_id,module_code,term,subject_id,section_id,time_limit,cheating_attempts,is_shuffle,allow_review,allow_hint,hint_count,is_active,start_date,end_date,start_time,end_time,academic_term:term(id,term_name,semester),subject:subject_id(subject_name),section:section_id(id,section_name)'
    )
    .eq('educator_id', educatorId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load modules.'))
  }

  const moduleRows = (data || []) as ModuleRow[]
  return moduleRows.map((row) => {
    const subject = Array.isArray(row.subject) ? row.subject[0] : row.subject
    const section = Array.isArray(row.section) ? row.section[0] : row.section
    const academicTerm = Array.isArray(row.academic_term) ? row.academic_term[0] : row.academic_term

    return {
      id: row.id,
      moduleId: row.module_id,
      moduleCode: row.module_code,
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
      allowHint: row.allow_hint,
      hintCount: row.hint_count,
      status: row.is_active ? 'active' : 'inactive',
      startDate: row.start_date,
      endDate: row.end_date,
      startTime: row.start_time,
      endTime: row.end_time,
    } satisfies ModuleRecord
  })
}

// createModules - create one module row per selected subject
export async function createModules(input: ModuleCreateInput) {
  const educatorId = await getCurrentEducatorId()
  const normalizedModuleCode = input.moduleCode.trim()

  await ensureUniqueModuleCodes(
    educatorId,
    normalizedModuleCode,
    input.selections,
    input.academicTermId
  )

  const supabase = createClient()
  const rowsToInsert = input.selections.map((selection) => ({
    educator_id: educatorId,
    subject_id: selection.subjectId,
    section_id: selection.sectionId,
    module_code: normalizedModuleCode,
    term: input.academicTermId,
    time_limit: input.timeLimit.trim(),
    cheating_attempts: input.cheatingAttempts ?? 0,
    is_shuffle: input.isShuffle,
    allow_review: input.allowReview,
    allow_hint: input.allowHint,
    hint_count: input.allowHint ? input.hintCount ?? 0 : 0,
    is_active: input.status === 'active',
    start_date: input.startDate,
    end_date: input.endDate,
    start_time: input.startTime,
    end_time: input.endTime,
  }))

  const { data, error } = await supabase
    .from('tbl_modules')
    .insert(rowsToInsert)
    .select(
      'id,module_id,module_code,term,subject_id,section_id,time_limit,cheating_attempts,is_shuffle,allow_review,allow_hint,hint_count,is_active,start_date,end_date,start_time,end_time'
    )

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to create modules.'))
  }

  const selectionMap = new Map(
    input.selections.map((selection) => [`${selection.subjectId}:${selection.sectionId}`, selection])
  )

  return ((data || []) as ModuleRow[]).map((row) => {
    const selection = selectionMap.get(`${row.subject_id}:${row.section_id}`)

    if (!selection) {
      throw new Error('Created module row could not be matched to the selected subject.')
    }

    return {
      id: row.id,
      moduleId: row.module_id,
      moduleCode: row.module_code,
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
      allowHint: row.allow_hint,
      hintCount: row.hint_count,
      status: row.is_active ? 'active' : 'inactive',
      startDate: row.start_date,
      endDate: row.end_date,
      startTime: row.start_time,
      endTime: row.end_time,
    } satisfies ModuleRecord
  })
}

// updateModule - update one module row
export async function updateModule(input: ModuleUpdateInput) {
  const educatorId = await getCurrentEducatorId()
  const normalizedModuleCode = input.moduleCode.trim()

  await ensureUniqueModuleCodes(
    educatorId,
    normalizedModuleCode,
    [input.selection],
    input.academicTermId,
    input.id
  )

  const supabase = createClient()
  const { data, error } = await supabase
    .from('tbl_modules')
    .update({
      subject_id: input.selection.subjectId,
      section_id: input.selection.sectionId,
      module_code: normalizedModuleCode,
      term: input.academicTermId,
      time_limit: input.timeLimit.trim(),
      cheating_attempts: input.cheatingAttempts ?? 0,
      is_shuffle: input.isShuffle,
      allow_review: input.allowReview,
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
      'id,module_id,module_code,term,subject_id,section_id,time_limit,cheating_attempts,is_shuffle,allow_review,allow_hint,hint_count,is_active,start_date,end_date,start_time,end_time'
    )

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to update module.'))
  }

  const updatedRow = ((data || []) as ModuleRow[])[0]

  if (!updatedRow) {
    throw new Error('You do not have permission to update this module.')
  }

  return {
    id: updatedRow.id,
    moduleId: updatedRow.module_id,
    moduleCode: updatedRow.module_code,
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
    allowHint: updatedRow.allow_hint,
    hintCount: updatedRow.hint_count,
    status: updatedRow.is_active ? 'active' : 'inactive',
    startDate: updatedRow.start_date,
    endDate: updatedRow.end_date,
    startTime: updatedRow.start_time,
    endTime: updatedRow.end_time,
  } satisfies ModuleRecord
}

// deleteModule - remove one module row
export async function deleteModule(moduleId: number) {
  const educatorId = await getCurrentEducatorId()
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tbl_modules')
    .delete()
    .eq('educator_id', educatorId)
    .eq('id', moduleId)
    .select('id')

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to delete module.'))
  }

  const deletedRows = (data || []) as DeletedModuleRow[]

  if (deletedRows.length === 0) {
    throw new Error('You do not have permission to delete this module.')
  }
}
