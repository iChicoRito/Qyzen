'use client'

import { createBrowserClient } from '@supabase/ssr'

interface SupabaseClientConfig {
  url: string
  anonKey: string
}

let browserClient: ReturnType<typeof createBrowserClient> | null = null

// getSupabaseClientConfig - read client env values
export function getSupabaseClientConfig(): SupabaseClientConfig {
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

// getSupabaseClientHeaders - build client request headers
export function getSupabaseClientHeaders() {
  const { anonKey } = getSupabaseClientConfig()

  return {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
  }
}

// createClient - build browser supabase client
export function createClient() {
  if (browserClient) {
    return browserClient
  }

  const { url, anonKey } = getSupabaseClientConfig()
  browserClient = createBrowserClient(url, anonKey)

  return browserClient
}
