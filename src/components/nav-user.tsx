'use client'

import { useState } from 'react'
import {
  IconUserCircle,
  IconDotsVertical,
  IconLoader2 as Loader2,
  IconLogout,
  IconShieldCheck,
} from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { getRoleLabel, type AppRole } from '@/lib/auth/auth-context'
import { createClient } from '@/lib/supabase/client'
import { deleteStudentPresence } from '@/lib/supabase/student-presence'

interface NavUserProps {
  user: {
    id: number
    name: string
    email: string
    avatar: string
  }
  role: AppRole
  roles?: AppRole[]
}

// NavUser - render current user menu
export function NavUser({ user, role, roles }: NavUserProps) {
  // ==================== HOOKS ====================
  const { isMobile } = useSidebar()
  const router = useRouter()
  const supabase = createClient()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const assignedRoles = roles?.length ? roles : [role]

  // handleLogout - sign out current user
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)

      if (assignedRoles.includes('student') && user.id > 0) {
        await deleteStudentPresence({
          studentId: user.id,
        })
      }

      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      router.replace('/auth/sign-in')
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to log out.'
      toast.error(message)
    } finally {
      setIsLoggingOut(false)
    }
  }

  // ==================== RENDER ====================
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg">
                <IconUserCircle size={20} />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {assignedRoles.map(getRoleLabel).join(', ')}
                </span>
              </div>
              <IconDotsVertical size={18} />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <div className="h-full w-6 rounded-lg">
                  <IconUserCircle size={20} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="text-muted-foreground truncate text-xs">{user.email}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {assignedRoles.map(getRoleLabel).join(', ')}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-default">
              <IconShieldCheck size={18} />
              Signed in as {assignedRoles.map(getRoleLabel).join(', ')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              disabled={isLoggingOut}
              onClick={handleLogout}
            >
              {isLoggingOut ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <IconLogout size={18} />
                  Log out
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
