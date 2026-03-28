'use client'

import React from 'react'

import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { ThemeCustomizer, ThemeCustomizerTrigger } from '@/components/theme-customizer'
import { useSidebarConfig } from '@/hooks/use-sidebar-config'
import { type AppRole } from '@/lib/auth/auth-context'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

interface DashboardShellProps {
  children: React.ReactNode
  role: AppRole
  user: {
    name: string
    email: string
  }
}

// DashboardShell - shared protected dashboard layout
export function DashboardShell({ children, role, user }: DashboardShellProps) {
  // ==================== SHELL STATE ====================
  const [themeCustomizerOpen, setThemeCustomizerOpen] = React.useState(false)
  const { config } = useSidebarConfig()

  // ==================== RENDER ====================
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '16rem',
          '--sidebar-width-icon': '3rem',
          '--header-height': 'calc(var(--spacing) * 14)',
        } as React.CSSProperties
      }
      className={config.collapsible === 'none' ? 'sidebar-none-mode' : ''}
    >
      {config.side === 'left' ? (
        <>
          <AppSidebar
            role={role}
            user={user}
            variant={config.variant}
            collapsible={config.collapsible}
            side={config.side}
          />
          <SidebarInset>
            <SiteHeader />
            <div className="flex flex-1 flex-col">
              <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">{children}</div>
              </div>
            </div>
          </SidebarInset>
        </>
      ) : (
        <>
          <SidebarInset>
            <SiteHeader />
            <div className="flex flex-1 flex-col">
              <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">{children}</div>
              </div>
            </div>
          </SidebarInset>
          <AppSidebar
            role={role}
            user={user}
            variant={config.variant}
            collapsible={config.collapsible}
            side={config.side}
          />
        </>
      )}

      {/* theme customizer */}
      <ThemeCustomizerTrigger onClick={() => setThemeCustomizerOpen(true)} />
      <ThemeCustomizer open={themeCustomizerOpen} onOpenChange={setThemeCustomizerOpen} />
    </SidebarProvider>
  )
}
