import { NextResponse } from 'next/server'

import { fetchAuthContext } from '@/lib/auth/auth-context'
import { LEARNING_MATERIALS_BUCKET } from '@/lib/supabase/learning-materials'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { NotificationInsertInput } from '@/types/notification'
import {
  getLearningMaterialExtension,
  isLearningMaterialExtensionAllowed,
  parseLearningMaterialSelectionKey,
  uploadLearningMaterialsSchema,
} from '@/lib/validations/learning-materials.schema'

interface SubjectTargetRow {
  id: number
  subject_code: string
  subject_name: string
  is_active: boolean
  sections_id: number
  section: SubjectSectionRow | SubjectSectionRow[] | null
}

interface SubjectSectionRow {
  id: number
  section_name: string
  is_active: boolean
}

interface EnrollmentRecipientRow {
  student_id: number
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
  subject: {
    subject_code: string
    subject_name: string
    is_active: boolean
  } | Array<{
    subject_code: string
    subject_name: string
    is_active: boolean
  }> | null
  section: {
    section_name: string
    is_active: boolean
  } | Array<{
    section_name: string
    is_active: boolean
  }> | null
}

interface SupabaseErrorResponse {
  message?: string
}

// getSingleRelation - normalize Supabase relation arrays
function getSingleRelation<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] || null : value
}

// getSupabaseErrorMessage - normalize Supabase errors
function getSupabaseErrorMessage(error: SupabaseErrorResponse | null, fallbackMessage: string) {
  return error?.message || fallbackMessage
}

// sanitizeFileNameSegment - keep storage paths stable and readable
function sanitizeFileNameSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase()
}

// resolveEducatorContext - require an authenticated educator
async function resolveEducatorContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized.')
  }

  const context = await fetchAuthContext(supabase, user)

  if (!context.roles.includes('educator')) {
    throw new Error('Forbidden.')
  }

  return context.profile.id
}

// fetchTargetRows - load educator subject and section options
async function fetchTargetRows(educatorId: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tbl_subjects')
    .select('id,subject_code,subject_name,is_active,sections_id,section:sections_id(id,section_name,is_active)')
    .eq('educator_id', educatorId)
    .order('subject_code', { ascending: true })

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load upload targets.'))
  }

  return (data || []) as SubjectTargetRow[]
}

// mapGroupedMaterials - group educator material rows for the client table
function mapGroupedMaterials(rows: LearningMaterialRow[]) {
  const groupedRows = new Map<
    string,
    {
      subjectId: number
      sectionId: number
      subjectCode: string
      subjectName: string
      sectionName: string
      status: 'active' | 'inactive'
      totalFiles: number
      updatedAt: string
      files: Array<{
        id: number
        fileName: string
        fileExtension: string
        mimeType: string
        fileSize: number
        storageBucket: string
        createdAt: string
        updatedAt: string
        isActive: boolean
      }>
    }
  >()

  rows.forEach((row) => {
    const subject = getSingleRelation(row.subject)
    const section = getSingleRelation(row.section)

    if (!subject || !section) {
      return
    }

    const groupKey = `${row.subject_id}:${row.section_id}`
    const nextFile = {
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
    const existingGroup = groupedRows.get(groupKey)

    if (!existingGroup) {
      groupedRows.set(groupKey, {
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
  })

  return Array.from(groupedRows.values()).sort(
    (leftGroup, rightGroup) =>
      new Date(rightGroup.updatedAt).getTime() - new Date(leftGroup.updatedAt).getTime()
  )
}

// fetchGroupedMaterials - load educator materials from the database
async function fetchGroupedMaterials(educatorId: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tbl_learning_materials')
    .select(
      'id,subject_id,section_id,file_name,file_extension,mime_type,file_size,storage_bucket,created_at,updated_at,is_active,subject:subject_id(subject_code,subject_name,is_active),section:section_id(section_name,is_active)'
    )
    .eq('educator_id', educatorId)
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load learning materials.'))
  }

  return mapGroupedMaterials((data || []) as LearningMaterialRow[])
}

// validateUploadedFile - block unsupported uploads
function validateUploadedFile(file: File) {
  if (!isLearningMaterialExtensionAllowed(file.name)) {
    throw new Error(`Unsupported file type for ${file.name}.`)
  }
}

// buildStoragePath - create a reusable storage path for one uploaded file
function buildStoragePath(educatorId: number, file: File) {
  const extension = getLearningMaterialExtension(file.name)
  const baseName = sanitizeFileNameSegment(file.name.replace(/\.[^.]+$/, '')) || 'learning-material'
  return `${educatorId}/${Date.now()}-${crypto.randomUUID()}-${baseName}.${extension}`
}

// ensureValidTargets - check that each selected subject and section pair belongs to the educator
function ensureValidTargets(selectionKeys: string[], targetRows: SubjectTargetRow[]) {
  const validTargetKeys = new Set(
    targetRows
      .map((row) => {
        const section = getSingleRelation(row.section)
        return section ? `${row.id}:${section.id}` : null
      })
      .filter((value): value is string => Boolean(value))
  )

  selectionKeys.forEach((selectionKey) => {
    if (!validTargetKeys.has(selectionKey)) {
      throw new Error('One or more selected subject and section assignments are invalid.')
    }
  })
}

// fetchActiveStudentRecipientIds - load active enrolled student ids for one subject
async function fetchActiveStudentRecipientIds(educatorId: number, subjectId: number) {
  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('tbl_enrolled')
    .select('student_id')
    .eq('educator_id', educatorId)
    .eq('subject_id', subjectId)
    .eq('is_active', true)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load notification recipients.'))
  }

  return Array.from(new Set(((data || []) as EnrollmentRecipientRow[]).map((row) => row.student_id)))
}

// buildUploadNotificationInputs - create learning material upload notifications
async function buildUploadNotificationInputs(
  educatorId: number,
  targetRows: SubjectTargetRow[],
  targetPairs: Array<{ subjectId: number; sectionId: number }>,
  files: File[]
) {
  const uniqueTargets = Array.from(
    new Map(targetPairs.map((targetPair) => [`${targetPair.subjectId}:${targetPair.sectionId}`, targetPair])).values()
  )
  const notificationRows: NotificationInsertInput[] = []

  for (const targetPair of uniqueTargets) {
    const targetRow = targetRows.find(
      (row) => row.id === targetPair.subjectId && row.sections_id === targetPair.sectionId
    )
    const section = targetRow ? getSingleRelation(targetRow.section) : null

    if (!targetRow || !section) {
      continue
    }

    const recipientUserIds = await fetchActiveStudentRecipientIds(educatorId, targetPair.subjectId)

    recipientUserIds.forEach((recipientUserId) => {
      notificationRows.push({
        recipientUserId,
        actorUserId: educatorId,
        eventType: 'learning_material_uploaded',
        title: files.length > 1 ? 'New learning materials uploaded' : 'New learning material uploaded',
        message:
          files.length > 1
            ? `${files.length} new learning materials were uploaded for ${targetRow.subject_name} in ${section.section_name}.`
            : `${files[0]?.name || 'A learning material'} was uploaded for ${targetRow.subject_name} in ${section.section_name}.`,
        linkPath: '/student/materials',
        subjectId: targetPair.subjectId,
        sectionId: targetPair.sectionId,
        metadata: {
          subjectName: targetRow.subject_name,
          sectionName: section.section_name,
          fileName: files[0]?.name,
          fileCount: files.length,
        },
      })
    })
  }

  return notificationRows
}

// GET - return grouped materials or upload targets for the authenticated educator
export async function GET(request: Request) {
  try {
    const educatorId = await resolveEducatorContext()
    const { searchParams } = new URL(request.url)

    if (searchParams.get('view') === 'targets') {
      const targetRows = await fetchTargetRows(educatorId)
      const targets = targetRows
        .map((row) => {
          const section = getSingleRelation(row.section)

          if (!section) {
            return null
          }

          return {
            selectionKey: `${row.id}:${section.id}`,
            subjectId: row.id,
            sectionId: section.id,
            subjectCode: row.subject_code,
            subjectName: row.subject_name,
            sectionName: section.section_name,
            status: row.is_active && section.is_active ? 'active' : 'inactive',
          }
        })
        .filter((target): target is NonNullable<typeof target> => Boolean(target))

      return NextResponse.json({ targets })
    }

    const groups = await fetchGroupedMaterials(educatorId)
    return NextResponse.json({ groups })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load learning materials.'
    const status = message === 'Unauthorized.' ? 401 : message === 'Forbidden.' ? 403 : 400
    return NextResponse.json({ message }, { status })
  }
}

// POST - upload files and create one row per file and selected target
export async function POST(request: Request) {
  try {
    const educatorId = await resolveEducatorContext()
    const formData = await request.formData()
    const selectionKeys = formData
      .getAll('selectionKeys')
      .filter((value): value is string => typeof value === 'string')
    const files = formData
      .getAll('files')
      .filter((value): value is File => value instanceof File && value.size > 0)

    uploadLearningMaterialsSchema.parse({
      selectionKeys,
      filesCount: files.length,
    })

    files.forEach(validateUploadedFile)

    const targetRows = await fetchTargetRows(educatorId)
    ensureValidTargets(selectionKeys, targetRows)

    const adminClient = createAdminClient()
    const targetPairs = selectionKeys.map(parseLearningMaterialSelectionKey)
    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const storagePath = buildStoragePath(educatorId, file)
        const uploadResult = await adminClient.storage.from(LEARNING_MATERIALS_BUCKET).upload(storagePath, file, {
          upsert: false,
          contentType: file.type || 'application/octet-stream',
        })

        if (uploadResult.error) {
          throw new Error(uploadResult.error.message || `Failed to upload ${file.name}.`)
        }

        return {
          storagePath,
          file,
        }
      })
    )

    const rowsToInsert = uploadedFiles.flatMap(({ storagePath, file }) =>
      targetPairs.map((targetPair) => ({
        educator_id: educatorId,
        subject_id: targetPair.subjectId,
        section_id: targetPair.sectionId,
        storage_bucket: LEARNING_MATERIALS_BUCKET,
        storage_path: storagePath,
        file_name: file.name,
        file_extension: getLearningMaterialExtension(file.name),
        mime_type: file.type || 'application/octet-stream',
        file_size: file.size,
        is_active: true,
      }))
    )

    const { error } = await adminClient.from('tbl_learning_materials').insert(rowsToInsert)

    if (error) {
      throw new Error(getSupabaseErrorMessage(error, 'Failed to save learning materials.'))
    }

    const notificationRows = await buildUploadNotificationInputs(educatorId, targetRows, targetPairs, files)

    if (notificationRows.length > 0) {
      const { error: notificationError } = await adminClient.from('tbl_notifications').insert(
        notificationRows.map((notificationRow) => ({
          recipient_user_id: notificationRow.recipientUserId,
          actor_user_id: notificationRow.actorUserId,
          event_type: notificationRow.eventType,
          title: notificationRow.title,
          message: notificationRow.message,
          link_path: notificationRow.linkPath,
          module_id: notificationRow.moduleId ?? null,
          subject_id: notificationRow.subjectId ?? null,
          section_id: notificationRow.sectionId ?? null,
          metadata: notificationRow.metadata ?? null,
          is_read: false,
          read_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))
      )

      if (notificationError) {
        throw new Error(getSupabaseErrorMessage(notificationError, 'Failed to save notifications.'))
      }
    }

    const groups = await fetchGroupedMaterials(educatorId)
    return NextResponse.json({ groups })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload learning materials.'
    const status = message === 'Unauthorized.' ? 401 : message === 'Forbidden.' ? 403 : 400
    return NextResponse.json({ message }, { status })
  }
}
