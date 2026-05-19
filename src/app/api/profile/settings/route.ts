import { NextResponse } from 'next/server'

import { fetchAuthContext } from '@/lib/auth/auth-context'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getStoragePublicUrl } from '@/lib/supabase/storage'
import {
  createProfileSettingsSchema,
} from '@/lib/validations/profile-settings.schema'

interface CurrentUserRow {
  id: number
  user_id: string
  email: string
  given_name: string
  surname: string
  profile_picture: string | null
  cover_photo: string | null
}

const PROFILE_MEDIA_BUCKET = 'profile-media'

// isUploadedFile - narrow form values to uploaded files
function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0
}

// getFileExtension - keep uploaded file names consistent by mime type
function getFileExtension(file: File) {
  const fileNameExtension = file.name.split('.').pop()?.trim().toLowerCase()

  if (fileNameExtension) {
    return fileNameExtension
  }

  if (file.type === 'image/png') {
    return 'png'
  }

  if (file.type === 'image/webp') {
    return 'webp'
  }

  return 'jpg'
}

// buildStoragePath - create a deterministic user-scoped storage path
function buildStoragePath(userId: number, fieldName: 'profile' | 'cover', file: File) {
  return `${userId}/${fieldName}.${getFileExtension(file)}`
}

// getStringValue - normalize text fields from multipart form data
function getStringValue(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName)

  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}

// normalizeEmail - keep email lookups consistent
function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

// validateUploadedImage - block unsupported or oversized uploads
function validateUploadedImage(file: File, label: string) {
  if (!file.type.startsWith('image/')) {
    throw new Error(`${label} must be an image file.`)
  }

  if (file.size > 2 * 1024 * 1024) {
    throw new Error(`${label} must be 2 MB or less.`)
  }
}

// ensureUniqueEmail - prevent duplicate email addresses
async function ensureUniqueEmail(userId: number, nextEmail: string) {
  const adminClient = createAdminClient()
  const { data: emailConflict, error: emailError } = await adminClient
    .from('tbl_users')
    .select('id')
    .eq('email', normalizeEmail(nextEmail))
    .neq('id', userId)
    .is('deleted_at', null)
    .maybeSingle()

  if (emailError) {
    throw new Error('Failed to validate profile email.')
  }

  if (emailConflict) {
    throw new Error('Email already exists.')
  }
}

// uploadProfileMedia - upload a profile image and return its stored path
async function uploadProfileMedia(
  userId: number,
  fieldName: 'profile' | 'cover',
  file: File,
  currentPath: string | null
) {
  const adminClient = createAdminClient()
  const nextPath = buildStoragePath(userId, fieldName, file)
  const uploadResult = await adminClient.storage
    .from(PROFILE_MEDIA_BUCKET)
    .upload(nextPath, file, {
      upsert: true,
      contentType: file.type,
    })

  if (uploadResult.error) {
    throw new Error(uploadResult.error.message || `Failed to upload ${fieldName} image.`)
  }

  if (currentPath && currentPath !== nextPath) {
    await adminClient.storage.from(PROFILE_MEDIA_BUCKET).remove([currentPath])
  }

  return {
    path: nextPath,
  }
}

// POST - update the current user's profile settings and media
export async function POST(request: Request) {
  try {
    // ==================== LOAD SESSION ====================
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 })
    }

    const context = await fetchAuthContext(supabase, user)
    const formData = await request.formData()
    const currentProfile = context.profile
    const payload = createProfileSettingsSchema(context.role, {
      givenName: currentProfile.givenName,
      surname: currentProfile.surname,
    }).parse({
      givenName: getStringValue(formData, 'givenName'),
      surname: getStringValue(formData, 'surname'),
      email: normalizeEmail(getStringValue(formData, 'email')),
    })

    const profilePictureFile = formData.get('profilePicture')
    const coverPhotoFile = formData.get('coverPhoto')

    if (isUploadedFile(profilePictureFile)) {
      validateUploadedImage(profilePictureFile, 'Profile picture')
    }

    if (isUploadedFile(coverPhotoFile)) {
      validateUploadedImage(coverPhotoFile, 'Cover photo')
    }

    // ==================== BUILD UPDATE PAYLOAD ====================
    await ensureUniqueEmail(currentProfile.id, payload.email)

    if (payload.email !== normalizeEmail(currentProfile.email)) {
      const authUpdateResult = await createAdminClient().auth.admin.updateUserById(user.id, {
        email: payload.email,
        email_confirm: true,
      })

      if (authUpdateResult.error) {
        throw new Error(authUpdateResult.error.message || 'Failed to update account email.')
      }
    }

    const updateFields: {
      given_name?: string
      surname?: string
      email?: string
      profile_picture?: string | null
      cover_photo?: string | null
      updated_at: string
    } = {
      given_name: payload.givenName,
      surname: payload.surname,
      email: payload.email,
      updated_at: new Date().toISOString(),
    }

    if (isUploadedFile(profilePictureFile)) {
      const uploadResult = await uploadProfileMedia(
        currentProfile.id,
        'profile',
        profilePictureFile,
        currentProfile.profilePicture
      )
      updateFields.profile_picture = uploadResult.path
    }

    if (isUploadedFile(coverPhotoFile)) {
      const uploadResult = await uploadProfileMedia(
        currentProfile.id,
        'cover',
        coverPhotoFile,
        currentProfile.coverPhoto
      )
      updateFields.cover_photo = uploadResult.path
    }

    // ==================== SAVE PROFILE ====================
    const { error: updateError } = await supabase
      .from('tbl_users')
      .update(updateFields)
      .eq('id', currentProfile.id)

    if (updateError) {
      throw new Error(updateError.message || 'Failed to update profile settings.')
    }

    const {
      data: updatedProfileData,
      error: updatedProfileError,
    } = await supabase
      .from('tbl_users')
      .select('id,user_id,email,given_name,surname,profile_picture,cover_photo')
      .eq('id', currentProfile.id)
      .single()

    if (updatedProfileError) {
      throw new Error(updatedProfileError.message || 'Failed to load updated profile settings.')
    }

    const updatedProfile = updatedProfileData as CurrentUserRow

    return NextResponse.json({
      message: 'Profile settings updated successfully.',
      profile: {
        userId: updatedProfile.user_id,
        email: updatedProfile.email,
        givenName: updatedProfile.given_name,
        surname: updatedProfile.surname,
        profilePicture: getStoragePublicUrl(PROFILE_MEDIA_BUCKET, updatedProfile.profile_picture),
        coverPhoto: getStoragePublicUrl(PROFILE_MEDIA_BUCKET, updatedProfile.cover_photo),
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'Failed to update profile settings.',
      },
      {
        status: 400,
      }
    )
  }
}
