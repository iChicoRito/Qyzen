import { requireServerAuthContext } from '@/lib/auth/server'
import { getStoragePublicUrl } from '@/lib/supabase/storage'

import { ProfileSettingsForm } from './profile-settings-form'

// ProfileSettingsPage - render the shared authenticated profile settings page
export default async function ProfileSettingsPage() {
  // ==================== LOAD CONTEXT ====================
  const context = await requireServerAuthContext()

  // ==================== RENDER ====================
  return (
    <ProfileSettingsForm
      role={context.role}
      profile={{
        id: context.profile.id,
        userId: context.profile.userId,
        email: context.profile.email,
        givenName: context.profile.givenName,
        surname: context.profile.surname,
        profilePicture: getStoragePublicUrl('profile-media', context.profile.profilePicture),
        coverPhoto: getStoragePublicUrl('profile-media', context.profile.coverPhoto),
      }}
    />
  )
}
