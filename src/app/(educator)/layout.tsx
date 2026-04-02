import { DashboardShell } from '@/components/layouts/dashboard-shell'
import { requireServerAuthContext } from '@/lib/auth/server'

// DashboardLayout - educator route guard and shell
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // ==================== LOAD CONTEXT ====================
  const context = await requireServerAuthContext('educator')

  // ==================== RENDER ====================
  return (
    <DashboardShell
      role={context.role ?? 'educator'}
      roles={context.roles}
      user={{
        id: context.profile.id,
        name: `${context.profile.givenName} ${context.profile.surname}`.trim(),
        email: context.profile.email,
      }}
    >
      {children}
    </DashboardShell>
  )
}
