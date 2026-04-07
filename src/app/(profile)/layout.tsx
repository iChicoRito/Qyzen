import { DashboardShell } from '@/components/layouts/dashboard-shell'
import { requireServerAuthContext } from '@/lib/auth/server'

// ProfileLayout - protect shared profile routes with the dashboard shell
export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  // ==================== LOAD CONTEXT ====================
  const context = await requireServerAuthContext()

  // ==================== RENDER ====================
  return (
    <DashboardShell
      role={context.role ?? 'admin'}
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
