import { redirect } from 'next/navigation'

import { fetchAuthContext, type AppRole } from '@/lib/auth/auth-context'
import { createClient } from '@/lib/supabase/server'

// getServerAuthContext - load current server auth context
export async function getServerAuthContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  return fetchAuthContext(supabase, user)
}

// requireServerAuthContext - protect server routes by auth role
export async function requireServerAuthContext(expectedRole?: AppRole) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/sign-in')
  }

  const context = await fetchAuthContext(supabase, user)

  if (!context.isActive || !context.isEmailVerified || !context.role || !context.dashboardPath) {
    await supabase.auth.signOut()
    redirect('/auth/sign-in')
  }

  if (expectedRole && !context.roles.includes(expectedRole)) {
    redirect(context.dashboardPath)
  }

  return context
}
