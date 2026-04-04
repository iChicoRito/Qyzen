import { createClient as createSupabaseClient } from '@supabase/supabase-js'

interface SupabaseAdminConfig {
  url: string
  serviceRoleKey: string
}

// getSupabaseAdminConfig - read server admin env values
export function getSupabaseAdminConfig(): SupabaseAdminConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Password reset is temporarily unavailable.')
  }

  return {
    url,
    serviceRoleKey,
  }
}

// createAdminClient - build a service role supabase client
export function createAdminClient() {
  const { url, serviceRoleKey } = getSupabaseAdminConfig()

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
