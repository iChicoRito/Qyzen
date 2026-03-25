'use client'

import { useEffect, useState } from 'react'
import { z } from 'zod'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { columns } from './components/columns'
import { DataTable } from './components/data-table'
import { permissionSchema, type Permission } from './data/schema'
import permissionsData from './data/data.json'

// getPermissions - load static permission data
async function getPermissions() {
  return z.array(permissionSchema).parse(permissionsData)
}

// PermissionsPage - manage permission records
export default function PermissionsPage() {
  // ==================== STATE ====================
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // loadPermissions - fetch sample permission data
    const loadPermissions = async () => {
      try {
        const permissionList = await getPermissions()
        setPermissions(permissionList)
      } catch (error) {
        console.error('Failed to load permissions:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPermissions()
  }, [])

  // handleAddPermissions - add new permission rows
  const handleAddPermissions = (newPermissions: Permission[]) => {
    setPermissions((prev) => [...newPermissions, ...prev])
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-muted-foreground">Loading permissions...</div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-2 px-4 md:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Permissions</h1>
        <p className="text-muted-foreground">View and manage RBAC permission records.</p>
      </div>

      <div className="px-4 md:hidden md:px-6">
        <div className="flex h-96 items-center justify-center rounded-lg border bg-muted/20">
          <div className="p-8 text-center">
            <h3 className="mb-2 text-lg font-semibold">Permissions Management</h3>
            <p className="text-muted-foreground">
              Please use a larger screen to view the full permissions management interface.
            </p>
          </div>
        </div>
      </div>

      <div className="hidden h-full flex-1 flex-col space-y-6 px-4 md:flex md:px-6">
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
              columns={columns}
              onAddPermissions={handleAddPermissions}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
