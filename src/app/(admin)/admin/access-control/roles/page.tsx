'use client'

import { useEffect, useState } from 'react'
import { z } from 'zod'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { columns } from './components/columns'
import { DataTable } from './components/data-table'
import { roleSchema, type Role } from './data/schema'
import rolesData from './data/term.json'

// getRoles - load static role data
async function getRoles() {
  return z.array(roleSchema).parse(rolesData)
}

// RolesPage - manage role records
export default function RolesPage() {
  // ==================== STATE ====================
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // loadRoles - fetch sample role data
    const loadRoles = async () => {
      try {
        const roleList = await getRoles()
        setRoles(roleList)
      } catch (error) {
        console.error('Failed to load roles:', error)
      } finally {
        setLoading(false)
      }
    }

    loadRoles()
  }, [])

  // handleAddRole - add a new role row
  const handleAddRole = (newRole: Role) => {
    setRoles((prev) => [newRole, ...prev])
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-muted-foreground">Loading roles...</div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-2 px-4 md:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Roles</h1>
        <p className="text-muted-foreground">View and manage RBAC roles and permissions setup.</p>
      </div>

      <div className="px-4 md:hidden md:px-6">
        <div className="flex h-96 items-center justify-center rounded-lg border bg-muted/20">
          <div className="p-8 text-center">
            <h3 className="mb-2 text-lg font-semibold">Roles Management</h3>
            <p className="text-muted-foreground">
              Please use a larger screen to view the full roles management interface.
            </p>
          </div>
        </div>
      </div>

      <div className="hidden h-full flex-1 flex-col space-y-6 px-4 md:flex md:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Roles Management</CardTitle>
            <CardDescription>
              View, filter, and manage role records in one place.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable data={roles} columns={columns} onAddRole={handleAddRole} />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
