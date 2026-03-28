'use client'

import * as React from 'react'
import {
  IconBook2,
  IconBrandNextjs,
  IconChecklist,
  IconLayoutDashboard,
  IconSchool,
  IconShieldCheck,
  IconUser,
} from '@tabler/icons-react'
import Link from 'next/link'

import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { type AppRole } from '@/lib/auth/auth-context'

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  role?: AppRole
  user?: {
    name: string
    email: string
  }
}

// getNavigationGroups - build sidebar items by role
function getNavigationGroups(role: AppRole) {
  if (role === 'admin') {
    return [
      {
        label: 'Dashboards',
        items: [
          {
            title: 'Dashboard',
            url: '/admin/dashboard',
            icon: IconLayoutDashboard,
          },
        ],
      },
      {
        label: 'Management',
        items: [
          {
            title: 'Users',
            url: '#',
            icon: IconUser,
            items: [
              {
                title: 'View all Users',
                url: '/admin/users',
              },
            ],
          },
          {
            title: 'Academic Settings',
            url: '#',
            icon: IconSchool,
            items: [
              {
                title: 'Academic Term',
                url: '/admin/academic-settings/academic-term',
              },
              {
                title: 'Academic Year',
                url: '/admin/academic-settings/academic-year',
              },
            ],
          },
        ],
      },
      {
        label: 'System',
        items: [
          {
            title: 'Access Control',
            url: '#',
            icon: IconShieldCheck,
            items: [
              {
                title: 'Roles',
                url: '/admin/access-control/roles',
              },
              {
                title: 'Permissions',
                url: '/admin/access-control/permissions',
              },
            ],
          },
        ],
      },
    ]
  }

  if (role === 'educator') {
    return [
      {
        label: 'Educator',
        items: [
          {
            title: 'Dashboard',
            url: '/educator/dashboard',
            icon: IconLayoutDashboard,
          },
          {
            title: 'Classes',
            url: '/educator/dashboard',
            icon: IconBook2,
          },
          {
            title: 'Students',
            url: '/educator/dashboard',
            icon: IconUser,
          },
        ],
      },
    ]
  }

  return [
    {
      label: 'Student',
      items: [
        {
          title: 'Dashboard',
          url: '/student/dashboard',
          icon: IconLayoutDashboard,
        },
        {
          title: 'Courses',
          url: '/student/dashboard',
          icon: IconBook2,
        },
        {
          title: 'Tasks',
          url: '/student/dashboard',
          icon: IconChecklist,
        },
      ],
    },
  ]
}

// getSidebarSubtitle - build sidebar subtitle by role
function getSidebarSubtitle(role: AppRole) {
  if (role === 'admin') {
    return 'Admin Dashboard'
  }

  if (role === 'educator') {
    return 'Educator Portal'
  }

  return 'Student Portal'
}

// AppSidebar - render role-aware sidebar
export function AppSidebar({ role = 'admin', user, ...props }: AppSidebarProps) {
  // ==================== NAV DATA ====================
  const navGroups = getNavigationGroups(role)
  const sidebarUser = user || {
    name: 'Template User',
    email: 'template@example.com',
  }

  // ==================== RENDER ====================
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={role === 'admin' ? '/admin/dashboard' : `/${role}/dashboard`}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <IconBrandNextjs size={20} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Shadcn Dashboard</span>
                  <span className="truncate text-xs">{getSidebarSubtitle(role)}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          role={role}
          user={{
            name: sidebarUser.name,
            email: sidebarUser.email,
            avatar: '',
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
