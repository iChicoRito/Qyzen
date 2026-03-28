import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { fetchAuthContext, getRoleFromPathname } from '@/lib/auth/auth-context'
import { updateSession } from '@/lib/supabase/middleware'

const authRoutes = ['/auth/sign-in', '/auth/sign-up']

// redirectWithSession - keep auth cookies on redirects
function redirectWithSession(request: NextRequest, pathname: string, response: NextResponse) {
  const redirectResponse = NextResponse.redirect(new URL(pathname, request.url))

  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie)
  })

  return redirectResponse
}

// middleware - protect auth and role routes
export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/auth/sign-in', request.url))
  }

  if (request.nextUrl.pathname === '/register') {
    return NextResponse.redirect(new URL('/auth/sign-up', request.url))
  }

  const { supabase, response } = updateSession(request)
  const protectedRole = getRoleFromPathname(request.nextUrl.pathname)
  const isAuthRoute = authRoutes.some((route) => request.nextUrl.pathname.startsWith(route))
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    if (protectedRole) {
      return redirectWithSession(request, '/auth/sign-in', response)
    }

    return response
  }

  try {
    const context = await fetchAuthContext(supabase, user)

    if (!context.isActive || !context.isEmailVerified || !context.role || !context.dashboardPath) {
      await supabase.auth.signOut()
      return redirectWithSession(request, '/auth/sign-in', response)
    }

    if (isAuthRoute) {
      return redirectWithSession(request, context.dashboardPath, response)
    }

    if (protectedRole && !context.roles.includes(protectedRole)) {
      return redirectWithSession(request, context.dashboardPath, response)
    }
  } catch {
    await supabase.auth.signOut()

    if (protectedRole || isAuthRoute) {
      return redirectWithSession(request, '/auth/sign-in', response)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
