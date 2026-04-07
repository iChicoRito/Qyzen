import { NextResponse } from 'next/server'

import { fetchAuthContext } from '@/lib/auth/auth-context'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

interface LearningMaterialAccessRow {
  id: number
  educator_id: number
  subject_id: number
  storage_bucket: string
  storage_path: string
  file_name: string
}

interface SupabaseErrorResponse {
  message?: string
}

// getSupabaseErrorMessage - normalize Supabase errors
function getSupabaseErrorMessage(error: SupabaseErrorResponse | null, fallbackMessage: string) {
  return error?.message || fallbackMessage
}

// parseMaterialId - validate route params
function parseMaterialId(materialIdValue: string) {
  const materialId = Number(materialIdValue)

  if (!Number.isInteger(materialId) || materialId <= 0) {
    throw new Error('Invalid learning material id.')
  }

  return materialId
}

// resolveAccessContext - require an authenticated user context
async function resolveAccessContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized.')
  }

  return fetchAuthContext(supabase, user)
}

// fetchMaterialRecord - load one learning material row by id
async function fetchMaterialRecord(materialId: number) {
  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('tbl_learning_materials')
    .select('id,educator_id,subject_id,storage_bucket,storage_path,file_name')
    .eq('id', materialId)
    .single()

  if (error || !data) {
    throw new Error(getSupabaseErrorMessage(error, 'Learning material was not found.'))
  }

  return data as LearningMaterialAccessRow
}

// ensureMaterialAccess - allow educators or enrolled students to open files
async function ensureMaterialAccess(profileId: number, roles: string[], material: LearningMaterialAccessRow) {
  if (roles.includes('admin')) {
    return
  }

  if (roles.includes('educator') && material.educator_id === profileId) {
    return
  }

  if (roles.includes('student')) {
    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from('tbl_enrolled')
      .select('id')
      .eq('student_id', profileId)
      .eq('educator_id', material.educator_id)
      .eq('subject_id', material.subject_id)
      .eq('is_active', true)
      .limit(1)

    if (error) {
      throw new Error(getSupabaseErrorMessage(error, 'Failed to validate file access.'))
    }

    if ((data || []).length > 0) {
      return
    }
  }

  throw new Error('Forbidden.')
}

// GET - redirect the user to a short-lived signed file url
export async function GET(
  request: Request,
  { params }: { params: Promise<{ materialId: string }> }
) {
  try {
    const context = await resolveAccessContext()
    const { materialId: materialIdValue } = await params
    const materialId = parseMaterialId(materialIdValue)
    const material = await fetchMaterialRecord(materialId)
    await ensureMaterialAccess(context.profile.id, context.roles, material)

    const { searchParams } = new URL(request.url)
    const shouldDownload = searchParams.get('download') === '1'
    const adminClient = createAdminClient()
    const { data, error } = await adminClient.storage
      .from(material.storage_bucket)
      .createSignedUrl(material.storage_path, 60, {
        download: shouldDownload ? material.file_name : false,
      })

    if (error || !data?.signedUrl) {
      throw new Error(error?.message || 'Failed to generate the file link.')
    }

    return NextResponse.redirect(data.signedUrl)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to open the learning material.'
    const status = message === 'Unauthorized.' ? 401 : message === 'Forbidden.' ? 403 : 400
    return NextResponse.json({ message }, { status })
  }
}
