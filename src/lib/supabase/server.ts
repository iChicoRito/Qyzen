import { createServerClient } from '@supabase/ssr'
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

interface SupabaseServerConfig {
  url: string
  anonKey: string
}

interface ServerCookie {
  name: string
  value: string
  options?: Partial<ResponseCookie>
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

// createClient - build server supabase client
export async function createClient() {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const { url, anonKey } = getSupabaseServerConfig()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: ServerCookie[]) {
        try {
          cookiesToSet.forEach(
            ({
              name,
              value,
              options,
            }: ServerCookie) => {
            cookieStore.set(name, value, options)
            }
          )
        } catch {
          // ignore server component cookie writes
        }
      },
    },
  })
}
