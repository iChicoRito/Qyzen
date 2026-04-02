import { DashboardShell } from '@/components/layouts/dashboard-shell'
import { StudentPresenceTracker } from '@/components/student-presence-tracker'
import { requireServerAuthContext } from '@/lib/auth/server'

// DashboardLayout - student route guard and shell
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // ==================== LOAD CONTEXT ====================
  const context = await requireServerAuthContext('student')

  // ==================== RENDER ====================
  return (
    <DashboardShell
      role={context.role ?? 'student'}
      roles={context.roles}
      user={{
        id: context.profile.id,
        name: `${context.profile.givenName} ${context.profile.surname}`.trim(),
        email: context.profile.email,
      }}
    >
      <StudentPresenceTracker studentId={context.profile.id} />
      {children}
    </DashboardShell>
  )
}
