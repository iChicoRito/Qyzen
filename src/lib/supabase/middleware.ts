import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

import { getSupabaseServerConfig } from '@/lib/supabase/server'

interface MiddlewareSessionResult {
  supabase: ReturnType<typeof createServerClient>
  response: NextResponse
}

interface MiddlewareCookie {
  name: string
  value: string
  options?: Parameters<NextResponse['cookies']['set']>[2]
}

// updateSession - refresh auth session inside middleware
export function updateSession(request: NextRequest): MiddlewareSessionResult {
  const { url, anonKey } = getSupabaseServerConfig()

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: MiddlewareCookie[]) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })

        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })

        cookiesToSet.forEach(
          ({
            name,
            value,
            options,
          }: {
            name: string
            value: string
            options?: MiddlewareCookie['options']
          }) => {
          response.cookies.set(name, value, options)
          }
        )
      },
    },
  })

  return {
    supabase,
    response,
  }
}
