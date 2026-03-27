import { getSupabaseClientConfig, getSupabaseClientHeaders } from './client'

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
function getSupabaseErrorMessage(error: SupabaseErrorResponse, fallbackMessage: string) {
  return error.message || fallbackMessage
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
  const { url } = getSupabaseClientConfig()
  const response = await fetch(
    `${url}/rest/v1/academic_year?select=id,year,is_active&order=year.desc`,
    {
      headers: getSupabaseClientHeaders(),
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    const error = (await response.json()) as SupabaseErrorResponse
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load academic years.'))
  }

  const rows = (await response.json()) as AcademicYearRow[]
  return rows.map(mapAcademicYearRow)
}

// createAcademicYear - insert academic year row
export async function createAcademicYear(academicYear: AcademicYearRecord) {
  const { url } = getSupabaseClientConfig()
  const response = await fetch(`${url}/rest/v1/academic_year`, {
    method: 'POST',
    headers: {
      ...getSupabaseClientHeaders(),
      Prefer: 'return=representation',
    },
    body: JSON.stringify([
      {
        year: academicYear.academicYear,
        is_active: academicYear.status === 'active',
      },
    ]),
  })

  if (!response.ok) {
    const error = (await response.json()) as SupabaseErrorResponse

    if (error.code === '23505') {
      throw new Error('Academic year already exists.')
    }

    throw new Error(getSupabaseErrorMessage(error, 'Failed to create academic year.'))
  }

  const rows = (await response.json()) as AcademicYearRow[]
  return mapAcademicYearRow(rows[0])
}

// fetchAcademicTerms - load academic term rows
export async function fetchAcademicTerms() {
  const { url } = getSupabaseClientConfig()
  const query =
    'select=id,term_name,semester,academic_year_id,is_active,academic_year:academic_year_id(year)&order=id.desc'
  const response = await fetch(`${url}/rest/v1/academic_term?${query}`, {
    headers: getSupabaseClientHeaders(),
    cache: 'no-store',
  })

  if (!response.ok) {
    const error = (await response.json()) as SupabaseErrorResponse
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load academic terms.'))
  }

  const rows = (await response.json()) as AcademicTermRow[]
  return rows.map(mapAcademicTermRow)
}

// getAcademicYearIdByYear - find academic year id from year text
async function getAcademicYearIdByYear(academicYear: string) {
  const { url } = getSupabaseClientConfig()
  const response = await fetch(
    `${url}/rest/v1/academic_year?select=id&year=eq.${encodeURIComponent(academicYear)}&limit=1`,
    {
      headers: getSupabaseClientHeaders(),
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    const error = (await response.json()) as SupabaseErrorResponse
    throw new Error(getSupabaseErrorMessage(error, 'Failed to resolve academic year.'))
  }

  const rows = (await response.json()) as Array<{ id: number }>

  if (!rows[0]) {
    throw new Error('Selected academic year does not exist.')
  }

  return rows[0].id
}

// deleteAcademicYear - remove academic year and related terms
export async function deleteAcademicYear(academicYear: string) {
  const { url } = getSupabaseClientConfig()
  const academicYearId = await getAcademicYearIdByYear(academicYear)

  const deleteTermsResponse = await fetch(
    `${url}/rest/v1/academic_term?academic_year_id=eq.${academicYearId}`,
    {
      method: 'DELETE',
      headers: getSupabaseClientHeaders(),
    }
  )

  if (!deleteTermsResponse.ok) {
    const error = (await deleteTermsResponse.json()) as SupabaseErrorResponse
    throw new Error(getSupabaseErrorMessage(error, 'Failed to delete related academic terms.'))
  }

  const deleteYearResponse = await fetch(
    `${url}/rest/v1/academic_year?year=eq.${encodeURIComponent(academicYear)}`,
    {
      method: 'DELETE',
      headers: getSupabaseClientHeaders(),
    }
  )

  if (!deleteYearResponse.ok) {
    const error = (await deleteYearResponse.json()) as SupabaseErrorResponse
    throw new Error(getSupabaseErrorMessage(error, 'Failed to delete academic year.'))
  }
}

// createAcademicTerm - insert academic term row
export async function createAcademicTerm(academicTerm: AcademicTermRecord) {
  const { url } = getSupabaseClientConfig()
  const academicYearId = await getAcademicYearIdByYear(academicTerm.academicYear)
  const response = await fetch(`${url}/rest/v1/academic_term`, {
    method: 'POST',
    headers: {
      ...getSupabaseClientHeaders(),
      Prefer: 'return=representation',
    },
    body: JSON.stringify([
      {
        term_name: academicTerm.academicTermName,
        semester: academicTerm.semester,
        academic_year_id: academicYearId,
        is_active: academicTerm.status === 'active',
      },
    ]),
  })

  if (!response.ok) {
    const error = (await response.json()) as SupabaseErrorResponse

    if (error.code === '23505') {
      throw new Error('Academic term already exists for the selected semester and academic year.')
    }

    throw new Error(getSupabaseErrorMessage(error, 'Failed to create academic term.'))
  }

  await response.json()

  return {
    academicTermName: academicTerm.academicTermName,
    semester: academicTerm.semester,
    academicYear: academicTerm.academicYear,
    status: academicTerm.status,
  }
}

// deleteAcademicTerm - remove academic term row
export async function deleteAcademicTerm(academicTerm: AcademicTermRecord) {
  const { url } = getSupabaseClientConfig()
  const academicYearId = await getAcademicYearIdByYear(academicTerm.academicYear)
  const query =
    `term_name=eq.${encodeURIComponent(academicTerm.academicTermName)}` +
    `&semester=eq.${encodeURIComponent(academicTerm.semester)}` +
    `&academic_year_id=eq.${academicYearId}`

  const response = await fetch(`${url}/rest/v1/academic_term?${query}`, {
    method: 'DELETE',
    headers: getSupabaseClientHeaders(),
  })

  if (!response.ok) {
    const error = (await response.json()) as SupabaseErrorResponse
    throw new Error(getSupabaseErrorMessage(error, 'Failed to delete academic term.'))
  }
}
