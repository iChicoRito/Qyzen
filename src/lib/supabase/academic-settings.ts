import { createClient } from './client'

export interface AcademicYearRecord {
  academicYear: string
  status: 'active' | 'inactive'
}

export interface AcademicTermRecord {
  academicTermName: string
  semester: '1st Semester' | '2nd Semester'
  academicYear: string
  status: 'active' | 'inactive'
}

interface AcademicYearRow {
  id: number
  year: string
  is_active: boolean
}

interface AcademicTermRelation {
  year: string
}

interface AcademicTermRow {
  id: number
  term_name: string
  semester: '1st Semester' | '2nd Semester'
  academic_year_id: number
  is_active: boolean
  academic_year?: AcademicTermRelation | AcademicTermRelation[] | null
}

interface SupabaseErrorResponse {
  code?: string
  message?: string
}

// getSupabaseErrorMessage - normalize api errors
function getSupabaseErrorMessage(error: SupabaseErrorResponse | null, fallbackMessage: string) {
  return error?.message || fallbackMessage
}

// mapAcademicYearRow - convert db row to ui record
function mapAcademicYearRow(row: AcademicYearRow): AcademicYearRecord {
  return {
    academicYear: row.year,
    status: row.is_active ? 'active' : 'inactive',
  }
}

// mapAcademicTermRow - convert db row to ui record
function mapAcademicTermRow(row: AcademicTermRow): AcademicTermRecord {
  const academicYearValue = Array.isArray(row.academic_year)
    ? row.academic_year[0]?.year
    : row.academic_year?.year

  return {
    academicTermName: row.term_name,
    semester: row.semester,
    academicYear: academicYearValue || String(row.academic_year_id),
    status: row.is_active ? 'active' : 'inactive',
  }
}

// fetchAcademicYears - load academic year rows
export async function fetchAcademicYears() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tbl_academic_year')
    .select('id,year,is_active')
    .order('year', { ascending: false })

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load academic years.'))
  }

  return ((data || []) as AcademicYearRow[]).map(mapAcademicYearRow)
}

// createAcademicYear - insert academic year row
export async function createAcademicYear(academicYear: AcademicYearRecord) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tbl_academic_year')
    .insert({
      year: academicYear.academicYear,
      is_active: academicYear.status === 'active',
    })
    .select('id,year,is_active')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('Academic year already exists.')
    }

    throw new Error(getSupabaseErrorMessage(error, 'Failed to create academic year.'))
  }

  return mapAcademicYearRow(data as AcademicYearRow)
}

// fetchAcademicTerms - load academic term rows
export async function fetchAcademicTerms() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tbl_academic_term')
    .select('id,term_name,semester,academic_year_id,is_active,academic_year:academic_year_id(year)')
    .order('id', { ascending: false })

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load academic terms.'))
  }

  return ((data || []) as AcademicTermRow[]).map(mapAcademicTermRow)
}

// getAcademicYearIdByYear - find academic year id from year text
async function getAcademicYearIdByYear(academicYear: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tbl_academic_year')
    .select('id')
    .eq('year', academicYear)
    .limit(1)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to resolve academic year.'))
  }

  const rows = (data || []) as Array<{ id: number }>

  if (!rows[0]) {
    throw new Error('Selected academic year does not exist.')
  }

  return rows[0].id
}

// deleteAcademicYear - remove academic year and related terms
export async function deleteAcademicYear(academicYear: string) {
  const supabase = createClient()
  const academicYearId = await getAcademicYearIdByYear(academicYear)

  const { error: deleteTermsError } = await supabase
    .from('tbl_academic_term')
    .delete()
    .eq('academic_year_id', academicYearId)

  if (deleteTermsError) {
    throw new Error(getSupabaseErrorMessage(deleteTermsError, 'Failed to delete related academic terms.'))
  }

  const { error: deleteYearError } = await supabase
    .from('tbl_academic_year')
    .delete()
    .eq('year', academicYear)

  if (deleteYearError) {
    throw new Error(getSupabaseErrorMessage(deleteYearError, 'Failed to delete academic year.'))
  }
}

// createAcademicTerm - insert academic term row
export async function createAcademicTerm(academicTerm: AcademicTermRecord) {
  const supabase = createClient()
  const academicYearId = await getAcademicYearIdByYear(academicTerm.academicYear)
  const { error } = await supabase.from('tbl_academic_term').insert({
    term_name: academicTerm.academicTermName,
    semester: academicTerm.semester,
    academic_year_id: academicYearId,
    is_active: academicTerm.status === 'active',
  })

  if (error) {
    if (error.code === '23505') {
      throw new Error('Academic term already exists for the selected semester and academic year.')
    }

    throw new Error(getSupabaseErrorMessage(error, 'Failed to create academic term.'))
  }

  return {
    academicTermName: academicTerm.academicTermName,
    semester: academicTerm.semester,
    academicYear: academicTerm.academicYear,
    status: academicTerm.status,
  }
}

// deleteAcademicTerm - remove academic term row
export async function deleteAcademicTerm(academicTerm: AcademicTermRecord) {
  const supabase = createClient()
  const academicYearId = await getAcademicYearIdByYear(academicTerm.academicYear)
  const { error } = await supabase
    .from('tbl_academic_term')
    .delete()
    .eq('term_name', academicTerm.academicTermName)
    .eq('semester', academicTerm.semester)
    .eq('academic_year_id', academicYearId)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to delete academic term.'))
  }
}
