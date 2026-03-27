interface SupabaseServerConfig {
  url: string
  anonKey: string
}

// getSupabaseServerConfig - read server env values
export function getSupabaseServerConfig(): SupabaseServerConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Supabase environment variables are missing.')
  }

  return {
    url,
    anonKey,
  }
}

// getSupabaseServerHeaders - build server request headers
export function getSupabaseServerHeaders() {
  const { anonKey } = getSupabaseServerConfig()

  return {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
  }
}
