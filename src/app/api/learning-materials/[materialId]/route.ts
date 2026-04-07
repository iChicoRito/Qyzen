import { NextResponse } from 'next/server'

import { fetchAuthContext } from '@/lib/auth/auth-context'
import { createAdminClient } from '@/lib/supabase/admin'
import { LEARNING_MATERIALS_BUCKET } from '@/lib/supabase/learning-materials'
import { createClient } from '@/lib/supabase/server'
import type { NotificationInsertInput } from '@/types/notification'
import {
  getLearningMaterialExtension,
  isLearningMaterialExtensionAllowed,
  parseLearningMaterialSelectionKey,
  updateLearningMaterialSchema,
} from '@/lib/validations/learning-materials.schema'

interface LearningMaterialRecord {
  id: number
  educator_id: number
  subject_id: number
  section_id: number
  storage_bucket: string
  storage_path: string
  file_name?: string
}

interface SubjectNotificationRow {
  subject_name: string
  section: { section_name: string } | { section_name: string }[] | null
}

interface EnrollmentRecipientRow {
  student_id: number
}

interface SupabaseErrorResponse {
  message?: string
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

// parseMaterialId - validate route params
function parseMaterialId(materialIdValue: string) {
  const materialId = Number(materialIdValue)

  if (!Number.isInteger(materialId) || materialId <= 0) {
    throw new Error('Invalid learning material id.')
  }

  return materialId
}

// validateUploadedFile - block unsupported uploads
function validateUploadedFile(file: File) {
  if (!isLearningMaterialExtensionAllowed(file.name)) {
    throw new Error(`Unsupported file type for ${file.name}.`)
  }
}

// buildStoragePath - create a storage path for a replacement upload
function buildStoragePath(educatorId: number, file: File) {
  const extension = getLearningMaterialExtension(file.name)
  const baseName = sanitizeFileNameSegment(file.name.replace(/\.[^.]+$/, '')) || 'learning-material'
  return `${educatorId}/${Date.now()}-${crypto.randomUUID()}-${baseName}.${extension}`
}

// fetchMaterialRecord - load one educator-owned learning material row
async function fetchMaterialRecord(educatorId: number, materialId: number) {
  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('tbl_learning_materials')
    .select('id,educator_id,subject_id,section_id,storage_bucket,storage_path,file_name')
    .eq('educator_id', educatorId)
    .eq('id', materialId)
    .single()

  if (error || !data) {
    throw new Error(getSupabaseErrorMessage(error, 'Learning material was not found.'))
  }

  return data as LearningMaterialRecord
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

// buildDeleteNotificationInputs - create learning material delete notifications
async function buildDeleteNotificationInputs(material: LearningMaterialRecord) {
  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('tbl_subjects')
    .select('subject_name,section:sections_id(section_name)')
    .eq('id', material.subject_id)
    .single()

  if (error || !data) {
    return [] as NotificationInsertInput[]
  }

  const subjectRow = data as SubjectNotificationRow
  const section = Array.isArray(subjectRow.section) ? subjectRow.section[0] : subjectRow.section

  if (!section) {
    return [] as NotificationInsertInput[]
  }

  const recipientUserIds = await fetchActiveStudentRecipientIds(material.educator_id, material.subject_id)

  return recipientUserIds.map((recipientUserId) => ({
    recipientUserId,
    actorUserId: material.educator_id,
    eventType: 'learning_material_deleted' as const,
    title: 'Learning material removed',
    message: `${material.file_name || 'A learning material'} was removed from ${subjectRow.subject_name} in ${section.section_name}.`,
    linkPath: '/student/materials',
    subjectId: material.subject_id,
    sectionId: material.section_id,
    metadata: {
      subjectName: subjectRow.subject_name,
      sectionName: section.section_name,
      fileName: material.file_name,
      fileCount: 1,
    },
  }))
}

// ensureValidTarget - verify that an educator owns the next subject and section pair
async function ensureValidTarget(educatorId: number, subjectId: number, sectionId: number) {
  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('tbl_subjects')
    .select('id')
    .eq('educator_id', educatorId)
    .eq('id', subjectId)
    .eq('sections_id', sectionId)
    .single()

  if (error || !data) {
    throw new Error('The selected subject and section assignment is invalid.')
  }
}

// cleanupUnusedStorageObject - delete a storage object when no rows still reference it
async function cleanupUnusedStorageObject(storageBucket: string, storagePath: string, excludedMaterialId?: number) {
  const adminClient = createAdminClient()
  let query = adminClient
    .from('tbl_learning_materials')
    .select('id')
    .eq('storage_bucket', storageBucket)
    .eq('storage_path', storagePath)

  if (excludedMaterialId) {
    query = query.neq('id', excludedMaterialId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to validate storage references.'))
  }

  if ((data || []).length === 0) {
    const removeResult = await adminClient.storage.from(storageBucket).remove([storagePath])

    if (removeResult.error) {
      throw new Error(removeResult.error.message || 'Failed to delete the stored file.')
    }
  }
}

// fetchGroupedMaterials - load fresh educator grouped rows
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

  const groupedRows = new Map<string, Record<string, unknown>>()

  ;((data || []) as Array<{
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
    subject:
      | { subject_code: string; subject_name: string; is_active: boolean }
      | Array<{ subject_code: string; subject_name: string; is_active: boolean }>
      | null
    section:
      | { section_name: string; is_active: boolean }
      | Array<{ section_name: string; is_active: boolean }>
      | null
  }>).forEach((row) => {
    const subject = Array.isArray(row.subject) ? row.subject[0] : row.subject
    const section = Array.isArray(row.section) ? row.section[0] : row.section

    if (!subject || !section) {
      return
    }

    const groupKey = `${row.subject_id}:${row.section_id}`
    const existingGroup = groupedRows.get(groupKey) as
      | {
          subjectId: number
          sectionId: number
          subjectCode: string
          subjectName: string
          sectionName: string
          status: 'active' | 'inactive'
          totalFiles: number
          updatedAt: string
          files: Array<Record<string, unknown>>
        }
      | undefined

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
      new Date(String(rightGroup.updatedAt)).getTime() - new Date(String(leftGroup.updatedAt)).getTime()
  )
}

// PATCH - update one learning material row and optionally replace its file
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ materialId: string }> }
) {
  try {
    const educatorId = await resolveEducatorContext()
    const { materialId: materialIdValue } = await params
    const materialId = parseMaterialId(materialIdValue)
    const currentMaterial = await fetchMaterialRecord(educatorId, materialId)
    const formData = await request.formData()
    const selectionKey = formData.get('selectionKey')
    const replacementFile = formData.get('file')

    updateLearningMaterialSchema.parse({
      selectionKey: typeof selectionKey === 'string' ? selectionKey : '',
      filesCount: replacementFile instanceof File && replacementFile.size > 0 ? 1 : 0,
    })

    const nextTarget = parseLearningMaterialSelectionKey(String(selectionKey))
    await ensureValidTarget(educatorId, nextTarget.subjectId, nextTarget.sectionId)

    const adminClient = createAdminClient()
    const updateFields: Record<string, unknown> = {
      subject_id: nextTarget.subjectId,
      section_id: nextTarget.sectionId,
      updated_at: new Date().toISOString(),
    }

    if (replacementFile instanceof File && replacementFile.size > 0) {
      validateUploadedFile(replacementFile)
      const nextStoragePath = buildStoragePath(educatorId, replacementFile)
      const uploadResult = await adminClient.storage
        .from(LEARNING_MATERIALS_BUCKET)
        .upload(nextStoragePath, replacementFile, {
          upsert: false,
          contentType: replacementFile.type || 'application/octet-stream',
        })

      if (uploadResult.error) {
        throw new Error(uploadResult.error.message || 'Failed to upload the replacement file.')
      }

      updateFields.storage_bucket = LEARNING_MATERIALS_BUCKET
      updateFields.storage_path = nextStoragePath
      updateFields.file_name = replacementFile.name
      updateFields.file_extension = getLearningMaterialExtension(replacementFile.name)
      updateFields.mime_type = replacementFile.type || 'application/octet-stream'
      updateFields.file_size = replacementFile.size
    }

    const { error } = await adminClient
      .from('tbl_learning_materials')
      .update(updateFields)
      .eq('id', materialId)
      .eq('educator_id', educatorId)

    if (error) {
      throw new Error(getSupabaseErrorMessage(error, 'Failed to update the learning material.'))
    }

    if (replacementFile instanceof File && replacementFile.size > 0) {
      await cleanupUnusedStorageObject(currentMaterial.storage_bucket, currentMaterial.storage_path, materialId)
    }

    const groups = await fetchGroupedMaterials(educatorId)
    return NextResponse.json({ groups })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update the learning material.'
    const status = message === 'Unauthorized.' ? 401 : message === 'Forbidden.' ? 403 : 400
    return NextResponse.json({ message }, { status })
  }
}

// DELETE - remove one learning material row and clean up its storage object when unused
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ materialId: string }> }
) {
  try {
    const educatorId = await resolveEducatorContext()
    const { materialId: materialIdValue } = await params
    const materialId = parseMaterialId(materialIdValue)
    const currentMaterial = await fetchMaterialRecord(educatorId, materialId)
    const notificationRows = await buildDeleteNotificationInputs(currentMaterial)
    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('tbl_learning_materials')
      .delete()
      .eq('id', materialId)
      .eq('educator_id', educatorId)

    if (error) {
      throw new Error(getSupabaseErrorMessage(error, 'Failed to delete the learning material.'))
    }

    if (notificationRows.length > 0) {
      const now = new Date().toISOString()
      const { error: notificationError } = await adminClient.from('tbl_notifications').insert(
        notificationRows.map((notificationRow) => ({
          recipient_user_id: notificationRow.recipientUserId,
          actor_user_id: notificationRow.actorUserId,
          event_type: notificationRow.eventType,
          title: notificationRow.title,
          message: notificationRow.message,
          link_path: notificationRow.linkPath,
          module_id: null,
          subject_id: notificationRow.subjectId ?? null,
          section_id: notificationRow.sectionId ?? null,
          metadata: notificationRow.metadata ?? null,
          is_read: false,
          read_at: null,
          created_at: now,
          updated_at: now,
        }))
      )

      if (notificationError) {
        throw new Error(getSupabaseErrorMessage(notificationError, 'Failed to save notifications.'))
      }
    }

    await cleanupUnusedStorageObject(currentMaterial.storage_bucket, currentMaterial.storage_path, materialId)

    const groups = await fetchGroupedMaterials(educatorId)
    return NextResponse.json({ groups })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete the learning material.'
    const status = message === 'Unauthorized.' ? 401 : message === 'Forbidden.' ? 403 : 400
    return NextResponse.json({ message }, { status })
  }
}
