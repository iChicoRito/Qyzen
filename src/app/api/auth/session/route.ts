import { NextResponse } from 'next/server'

import { fetchAuthContext } from '@/lib/auth/auth-context'
import { createClient } from '@/lib/supabase/server'

// GET - return current validated auth session
export async function GET() {
  try {
    // ==================== LOAD SESSION ====================
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 })
    }

    const context = await fetchAuthContext(supabase, user)

    if (!context.isActive) {
      await supabase.auth.signOut()
      return NextResponse.json({ message: 'Your account is inactive.' }, { status: 403 })
    }

    if (!context.isEmailVerified) {
      await supabase.auth.signOut()
      return NextResponse.json({ message: 'Please verify your email first.' }, { status: 403 })
    }

    if (!context.role || !context.dashboardPath) {
      await supabase.auth.signOut()
      return NextResponse.json({ message: 'No valid role was found for this account.' }, { status: 403 })
    }

    // ==================== RETURN DATA ====================
    return NextResponse.json({
      user: {
        name: `${context.profile.givenName} ${context.profile.surname}`.trim(),
        email: context.profile.email,
      },
      role: context.role,
      dashboardPath: context.dashboardPath,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load session.'
    return NextResponse.json({ message }, { status: 500 })
  }
}
