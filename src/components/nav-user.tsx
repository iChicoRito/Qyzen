'use client'

import { useState } from 'react'
import {
  IconBrandNextjs,
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

interface NavUserProps {
  user: {
    name: string
    email: string
    avatar: string
  }
  role: AppRole
}

// NavUser - render current user menu
export function NavUser({ user, role }: NavUserProps) {
  // ==================== HOOKS ====================
  const { isMobile } = useSidebar()
  const router = useRouter()
  const supabase = createClient()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // handleLogout - sign out current user
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)

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
                <IconBrandNextjs size={20} />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="text-muted-foreground truncate text-xs">{user.email}</span>
                <span className="text-muted-foreground truncate text-xs">{getRoleLabel(role)}</span>
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
                <div className="h-8 w-8 rounded-lg">
                  <IconBrandNextjs size={20} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="text-muted-foreground truncate text-xs">{user.email}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {getRoleLabel(role)}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-default">
              <IconShieldCheck size={18} />
              Signed in as {getRoleLabel(role)}
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
