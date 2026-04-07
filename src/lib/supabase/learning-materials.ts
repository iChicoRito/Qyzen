import { createClient } from './server'

export const LEARNING_MATERIALS_BUCKET = 'learning-materials'

export interface LearningMaterialTargetOption {
  selectionKey: string
  subjectId: number
  sectionId: number
  subjectCode: string
  subjectName: string
  sectionName: string
  status: 'active' | 'inactive'
}

export interface LearningMaterialFileRecord {
  id: number
  fileName: string
  fileExtension: string
  mimeType: string
  fileSize: number
  storageBucket: string
  createdAt: string
  updatedAt: string
  isActive: boolean
}

export interface LearningMaterialGroupRecord {
  subjectId: number
  sectionId: number
  subjectCode: string
  subjectName: string
  sectionName: string
  status: 'active' | 'inactive'
  totalFiles: number
  updatedAt: string
  files: LearningMaterialFileRecord[]
}

export interface StudentLearningMaterialGroupRecord extends LearningMaterialGroupRecord {
  educatorName: string
}

interface LearningMaterialSubjectRow {
  subject_code: string
  subject_name: string
  is_active: boolean
}

interface LearningMaterialSectionRow {
  section_name: string
  is_active: boolean
}

interface LearningMaterialEducatorRow {
  given_name: string
  surname: string
}

interface LearningMaterialRow {
  id: number
  subject_id: number
  section_id: number
  file_name: string
  file_extension: string
  mime_type: string
  file_size: number
  storage_bucket: string
  created_at: string
  updated_at: string
  is_active: boolean
  subject: LearningMaterialSubjectRow | LearningMaterialSubjectRow[] | null
  section: LearningMaterialSectionRow | LearningMaterialSectionRow[] | null
  educator?: LearningMaterialEducatorRow | LearningMaterialEducatorRow[] | null
}

interface StudentLearningMaterialResponse {
  groups: StudentLearningMaterialGroupRecord[]
}

interface EducatorLearningMaterialResponse {
  groups: LearningMaterialGroupRecord[]
}

interface LearningMaterialTargetResponse {
  targets: LearningMaterialTargetOption[]
}

interface ApiErrorResponse {
  message?: string
}

// getSingleRelation - normalize Supabase relation arrays
function getSingleRelation<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] || null : value
}

// getApiErrorMessage - normalize api errors
function getApiErrorMessage(error: ApiErrorResponse | null, fallbackMessage: string) {
  return error?.message || fallbackMessage
}

// buildEducatorName - format educator names for student groups
function buildEducatorName(educator: LearningMaterialEducatorRow | null) {
  if (!educator) {
    return 'Unknown Educator'
  }

  return `${educator.given_name} ${educator.surname}`.trim()
}

// mapLearningMaterialGroups - group raw learning material rows by subject and section
function mapLearningMaterialGroups(rows: LearningMaterialRow[]) {
  const groupedRecords = new Map<string, LearningMaterialGroupRecord>()

  rows.forEach((row) => {
    const subject = getSingleRelation(row.subject)
    const section = getSingleRelation(row.section)

    if (!subject || !section) {
      return
    }

    const groupKey = `${row.subject_id}:${row.section_id}`
    const nextFile: LearningMaterialFileRecord = {
      id: row.id,
      fileName: row.file_name,
      fileExtension: row.file_extension,
      mimeType: row.mime_type,
      fileSize: row.file_size,
      storageBucket: row.storage_bucket,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isActive: row.is_active,
    }
    const existingGroup = groupedRecords.get(groupKey)

    if (!existingGroup) {
      groupedRecords.set(groupKey, {
        subjectId: row.subject_id,
        sectionId: row.section_id,
        subjectCode: subject.subject_code,
        subjectName: subject.subject_name,
        sectionName: section.section_name,
        status: subject.is_active && section.is_active && row.is_active ? 'active' : 'inactive',
        totalFiles: 1,
        updatedAt: row.updated_at,
        files: [nextFile],
      })
      return
    }

    existingGroup.files.push(nextFile)
    existingGroup.totalFiles = existingGroup.files.length

    if (new Date(row.updated_at).getTime() > new Date(existingGroup.updatedAt).getTime()) {
      existingGroup.updatedAt = row.updated_at
    }

    if (existingGroup.status === 'active' && !row.is_active) {
      existingGroup.status = 'inactive'
    }
  })

  return Array.from(groupedRecords.values()).sort(
    (leftGroup, rightGroup) =>
      new Date(rightGroup.updatedAt).getTime() - new Date(leftGroup.updatedAt).getTime()
  )
}

// mapStudentLearningMaterialGroups - add educator names for student page groups
function mapStudentLearningMaterialGroups(rows: LearningMaterialRow[]) {
  const baseGroups = mapLearningMaterialGroups(rows)
  const educatorNameMap = new Map<string, string>()

  rows.forEach((row) => {
    const educator = getSingleRelation(row.educator || null)
    educatorNameMap.set(`${row.subject_id}:${row.section_id}`, buildEducatorName(educator))
  })

  return baseGroups.map((group) => ({
    ...group,
    educatorName: educatorNameMap.get(`${group.subjectId}:${group.sectionId}`) || 'Unknown Educator',
  }))
}

// fetchJson - request json from a local api route
async function fetchJson<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    cache: 'no-store',
  })

  if (!response.ok) {
    let errorPayload: ApiErrorResponse | null = null

    try {
      errorPayload = (await response.json()) as ApiErrorResponse
    } catch {
      errorPayload = null
    }

    throw new Error(getApiErrorMessage(errorPayload, 'The request failed.'))
  }

  return (await response.json()) as T
}

// fetchEducatorLearningMaterialGroups - load grouped educator learning materials
export async function fetchEducatorLearningMaterialGroups() {
  const response = await fetchJson<EducatorLearningMaterialResponse>('/api/learning-materials')
  return response.groups
}

// fetchLearningMaterialTargetOptions - load educator subject and section targets
export async function fetchLearningMaterialTargetOptions() {
  const response = await fetchJson<LearningMaterialTargetResponse>('/api/learning-materials?view=targets')
  return response.targets
}

// createLearningMaterials - upload one or more files and save database rows
export async function createLearningMaterials(formData: FormData) {
  const response = await fetchJson<{ groups: LearningMaterialGroupRecord[] }>('/api/learning-materials', {
    method: 'POST',
    body: formData,
  })

  return response.groups
}

// updateLearningMaterial - edit one material assignment or replace its file
export async function updateLearningMaterial(materialId: number, formData: FormData) {
  const response = await fetchJson<{ groups: LearningMaterialGroupRecord[] }>(
    `/api/learning-materials/${materialId}`,
    {
      method: 'PATCH',
      body: formData,
    }
  )

  return response.groups
}

// deleteLearningMaterial - delete one learning material row
export async function deleteLearningMaterial(materialId: number) {
  const response = await fetchJson<{ groups: LearningMaterialGroupRecord[] }>(
    `/api/learning-materials/${materialId}`,
    {
      method: 'DELETE',
    }
  )

  return response.groups
}

// getLearningMaterialFileUrl - build a protected file access url
export function getLearningMaterialFileUrl(materialId: number, download = false) {
  return `/api/learning-materials/${materialId}/file${download ? '?download=1' : ''}`
}

// formatLearningMaterialFileSize - convert bytes into a compact label
export function formatLearningMaterialFileSize(fileSize: number) {
  if (fileSize < 1024) {
    return `${fileSize} B`
  }

  if (fileSize < 1024 * 1024) {
    return `${(fileSize / 1024).toFixed(1)} KB`
  }

  return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`
}

// getLearningMaterialKindLabel - classify a material for ui badges
export function getLearningMaterialKindLabel(fileExtension: string) {
  if (['pptx', 'ppsx', 'ppt', 'pdf'].includes(fileExtension.toLowerCase())) {
    return 'Presentation'
  }

  return 'Document'
}

// fetchStudentLearningMaterialGroups - load student-visible learning materials on the server
export async function fetchStudentLearningMaterialGroups(studentId: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tbl_learning_materials')
    .select(
      'id,subject_id,section_id,file_name,file_extension,mime_type,file_size,storage_bucket,created_at,updated_at,is_active,subject:subject_id(subject_code,subject_name,is_active),section:section_id(section_name,is_active),educator:educator_id(given_name,surname)'
    )
    .eq('is_active', true)
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to load learning materials.'))
  }

  const rows = (data || []) as LearningMaterialRow[]

  return mapStudentLearningMaterialGroups(
    rows.filter((row) => Boolean(row.id) && Boolean(studentId))
  )
}
