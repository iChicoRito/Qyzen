import { DashboardShell } from '@/components/layouts/dashboard-shell'
import { requireServerAuthContext } from '@/lib/auth/server'

// DashboardLayout - student route guard and shell
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // ==================== LOAD CONTEXT ====================
  const context = await requireServerAuthContext('student')

  // ==================== RENDER ====================
  return (
    <DashboardShell
      role={context.role ?? 'student'}
      user={{
        name: `${context.profile.givenName} ${context.profile.surname}`.trim(),
        email: context.profile.email,
      }}
    >
      {children}
    </DashboardShell>
  )
}
