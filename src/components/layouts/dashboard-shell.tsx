'use client'

import React from 'react'
import { usePathname } from 'next/navigation'

import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { ThemeCustomizer, ThemeCustomizerTrigger } from '@/components/theme-customizer'
import { tweakcnThemes } from '@/config/theme-data'
import { useSidebarConfig } from '@/hooks/use-sidebar-config'
import { useThemeManager } from '@/hooks/use-theme-manager'
import { type AppRole } from '@/lib/auth/auth-context'
import type { ImportedTheme } from '@/types/theme-customizer'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

interface DashboardShellProps {
  children: React.ReactNode
  role: AppRole
  roles: AppRole[]
  user: {
    id: number
    name: string
    email: string
  }
}

// DashboardShell - shared protected dashboard layout
export function DashboardShell({ children, role, roles, user }: DashboardShellProps) {
  // ==================== SHELL STATE ====================
  const [themeCustomizerOpen, setThemeCustomizerOpen] = React.useState(false)
  const { config } = useSidebarConfig()
  const pathname = usePathname()
  const hideSidebar = role === 'student' && pathname === '/student/assessment/take-quiz'
  const showThemeCustomizer = pathname === `/${role}/dashboard`

  // ==================== GLOBAL THEME APPLIER ====================
  // Re-applies CSS variables from the persisted theme selection whenever
  // isDarkMode changes. This runs on ALL dashboard pages (not just the
  // homepage), so dark mode toggle works even after ThemeCustomizer unmounts.
  const { isDarkMode, applyTheme, applyTweakcnTheme, applyImportedTheme, applyRadius } = useThemeManager()

  React.useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const importedRaw = localStorage.getItem("qyzen-theme-imported")
      const persistedImport: ImportedTheme | null = importedRaw ? JSON.parse(importedRaw) : null
      const persistedTweakcn = localStorage.getItem("qyzen-theme-tweakcn") || ""
      const persistedPreset = localStorage.getItem("qyzen-theme-preset") || "default"
      const persistedRadius = localStorage.getItem("qyzen-theme-radius") || "0.5rem"

      if (persistedImport) {
        applyImportedTheme(persistedImport, isDarkMode)
      } else if (persistedTweakcn) {
        const tweakcnPreset = tweakcnThemes.find((t) => t.value === persistedTweakcn)?.preset
        if (tweakcnPreset) applyTweakcnTheme(tweakcnPreset, isDarkMode)
      } else {
        applyTheme(persistedPreset, isDarkMode)
      }

      applyRadius(persistedRadius)
    } catch {
      // localStorage unavailable or corrupted — fall back to CSS class theming
    }
  }, [isDarkMode, applyTheme, applyTweakcnTheme, applyImportedTheme, applyRadius])

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
          {!hideSidebar ? (
            <AppSidebar
              role={role}
              roles={roles}
              user={user}
              variant={config.variant}
              collapsible={config.collapsible}
              side={config.side}
            />
          ) : null}
          <SidebarInset>
            <SiteHeader role={role} userId={user.id} />
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
            <SiteHeader role={role} userId={user.id} />
            <div className="flex flex-1 flex-col">
              <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">{children}</div>
              </div>
            </div>
          </SidebarInset>
          {!hideSidebar ? (
            <AppSidebar
              role={role}
              roles={roles}
              user={user}
              variant={config.variant}
              collapsible={config.collapsible}
              side={config.side}
            />
          ) : null}
        </>
      )}

      {showThemeCustomizer ? (
        <>
          {/* theme customizer */}
          <ThemeCustomizerTrigger onClick={() => setThemeCustomizerOpen(true)} />
          <ThemeCustomizer open={themeCustomizerOpen} onOpenChange={setThemeCustomizerOpen} />
        </>
      ) : null}
    </SidebarProvider>
  )
}
