'use client'

import * as React from 'react'
import {
  IconBook2,
  IconChecklist,
  IconLayoutDashboard,
  IconSchool,
  IconShieldCheck,
  IconUser,
  IconChalkboardTeacher,
  IconId,
  IconSubtitlesEdit 
} from '@tabler/icons-react'
import Image from 'next/image'
import Link from 'next/link'
import qDark from '../../public/q-dark.png'
import qLight from '../../public/q-light.png'

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
  roles?: AppRole[]
  user?: {
    name: string
    email: string
  }
}

interface SidebarNavItem {
  title: string
  url: string
  icon?: React.ComponentType<{
    className?: string
    size?: number | string
    stroke?: number | string
  }>
  items?: Array<{
    title: string
    url: string
  }>
}

interface SidebarNavGroup {
  label: string
  items: SidebarNavItem[]
}

// getNavigationGroupsByRole - build sidebar items by role
function getNavigationGroupsByRole(role: AppRole): SidebarNavGroup[] {
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
        ],
      },
      {
        label: 'Management',
        items: [
          {
            title: 'Assessment',
            url: '#',
            icon: IconSubtitlesEdit,
            items: [
              {
                title: 'Modules',
                url: '/educator/assessment/modules',
              },
              {
                title: 'Quizzes',
                url: '/educator/assessment/quizzes',
              },
            ],
          },
          {
            title: 'Classroom',
            url: '#',
            icon: IconChalkboardTeacher,
            items: [
              {
                title: 'Subjects',
                url: '/educator/classroom/subjects',
              },
              {
                title: 'Sections',
                url: '/educator/classroom/sections',
              },
            ],
          },
          {
            title: 'Enrollment',
            url: '#',
            icon: IconId,
            items: [
              {
                title: 'Enroll Student',
                url: '/educator/enrollment',
              },
            ],
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

// mergeNavigationGroups - combine nav groups from multiple roles
function mergeNavigationGroups(roles: AppRole[]) {
  const groupMap = new Map<string, SidebarNavGroup>()

  roles.forEach((role) => {
    getNavigationGroupsByRole(role).forEach((group) => {
      const existingGroup = groupMap.get(group.label)

      if (!existingGroup) {
        groupMap.set(group.label, {
          label: group.label,
          items: group.items.map((item) => ({
            ...item,
            items: item.items ? [...item.items] : undefined,
          })),
        })
        return
      }

      group.items.forEach((item) => {
        const existingItem = existingGroup.items.find(
          (existingNavItem) => existingNavItem.title === item.title
        )

        if (!existingItem) {
          existingGroup.items.push({
            ...item,
            items: item.items ? [...item.items] : undefined,
          })
          return
        }

        if (item.items?.length) {
          const existingSubItems = existingItem.items || []
          item.items.forEach((subItem) => {
            if (!existingSubItems.some((existingSubItem) => existingSubItem.url === subItem.url)) {
              existingSubItems.push(subItem)
            }
          })
          existingItem.items = existingSubItems
        }
      })
    })
  })

  return Array.from(groupMap.values())
}

// getSidebarSubtitle - build sidebar subtitle by role
function getSidebarSubtitle(roles: AppRole[]) {
  if (roles.length > 1) {
    return 'Multi-Role Access'
  }

  if (roles[0] === 'admin') {
    return 'Admin Dashboard'
  }

  if (roles[0] === 'educator') {
    return 'Educator Portal'
  }

  return 'Student Portal'
}

// AppSidebar - render role-aware sidebar
export function AppSidebar({ role = 'admin', roles, user, ...props }: AppSidebarProps) {
  // ==================== NAV DATA ====================
  const assignedRoles = roles?.length ? roles : [role]
  const navGroups = mergeNavigationGroups(assignedRoles)
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
                <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg">
                  <Image
                    src={qDark}
                    alt="Qyzen logo"
                    width={32}
                    height={32}
                    className="block dark:hidden"
                  />
                  <Image
                    src={qLight}
                    alt="Qyzen logo"
                    width={32}
                    height={32}
                    className="hidden dark:block"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Qyzen</span>
                  <span className="truncate text-xs">{getSidebarSubtitle(assignedRoles)}</span>
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
          roles={assignedRoles}
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
