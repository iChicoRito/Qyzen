'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  createPermissions,
  deletePermission,
  fetchPermissions,
} from '@/lib/supabase/access-control'
import { getColumns } from './components/columns'
import { DataTable } from './components/data-table'
import { permissionSchema, type Permission } from './data/schema'

// PermissionsPage - manage permission records
export default function PermissionsPage() {
  // ==================== STATE ====================
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // loadPermissions - fetch permission data
  const loadPermissions = async () => {
    try {
      setLoading(true)
      setError(null)
      const permissionList = await fetchPermissions()
      setPermissions(permissionSchema.array().parse(permissionList))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load permissions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPermissions()
  }, [])

  // handleAddPermissions - add new permission rows
  const handleAddPermissions = async (newPermissions: Permission[]) => {
    const createdPermissions = await createPermissions(newPermissions)
    setPermissions((prev) => [...createdPermissions, ...prev])
  }

  // handleDeletePermission - remove permission row
  const handleDeletePermission = async (permission: Permission) => {
    await deletePermission(permission)
    setPermissions((prev) =>
      prev.filter((item) => item.permissionString !== permission.permissionString)
    )
  }

  if (loading) {
    return (
      <div className="flex min-w-0 flex-1 flex-col space-y-6 px-4 md:px-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-52" />
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
      <div className="flex min-w-0 flex-1 flex-col space-y-6 px-4 md:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Permissions Management</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={loadPermissions}
            >
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
        <h1 className="text-2xl font-bold tracking-tight">Permissions</h1>
        <p className="text-muted-foreground">View and manage RBAC permission records.</p>
      </div>

      <div className="flex min-w-0 flex-1 flex-col space-y-6 px-4 md:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Permissions Management</CardTitle>
            <CardDescription>
              View, filter, and manage permission records in one place.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={permissions}
              columns={getColumns({ onDeletePermission: handleDeletePermission })}
              onAddPermissions={handleAddPermissions}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
