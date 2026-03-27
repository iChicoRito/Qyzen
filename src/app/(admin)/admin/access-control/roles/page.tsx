'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { createRole, deleteRole, fetchRoles } from '@/lib/supabase/access-control'
import { getColumns } from './components/columns'
import { DataTable } from './components/data-table'
import { roleSchema, type Role } from './data/schema'

// RolesPage - manage role records
export default function RolesPage() {
  // ==================== STATE ====================
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // loadRoles - fetch role data
  const loadRoles = async () => {
    try {
      setLoading(true)
      setError(null)
      const roleList = await fetchRoles()
      setRoles(roleSchema.array().parse(roleList))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load roles.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRoles()
  }, [])

  // handleAddRole - add a new role row
  const handleAddRole = async (newRole: Role) => {
    const createdRole = await createRole(newRole)
    setRoles((prev) => [createdRole, ...prev])
  }

  // handleDeleteRole - remove role row
  const handleDeleteRole = async (role: Role) => {
    await deleteRole(role)
    setRoles((prev) => prev.filter((item) => item.roleName !== role.roleName))
  }

  if (loading) {
    return (
      <div className="hidden h-full flex-1 flex-col space-y-6 px-4 md:flex md:px-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="hidden h-full flex-1 flex-col space-y-6 px-4 md:flex md:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Roles Management</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="outline" className="cursor-pointer" onClick={loadRoles}>
              Retry
            </Button>
          </CardContent>
        </Card>
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
            <DataTable
              data={roles}
              columns={getColumns({ onDeleteRole: handleDeleteRole })}
              onAddRole={handleAddRole}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
