'use client'

import { useEffect, useState } from 'react'
import { IconArrowUp, IconSchool, IconShieldCheck, IconUserCheck, IconUsersGroup } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  createStudentsBulk,
  createUser,
  fetchUsers,
  type BulkCreateStudentInput,
  type CreateUserInput,
} from '@/lib/supabase/users'

import { columns } from './components/columns'
import { DataTable } from './components/data-table'
import { userSchema, type User } from './data/schema'

// UsersPage - manage user records
export default function UsersPage() {
  // ==================== STATE ====================
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // loadUsers - fetch user data
  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const userList = await fetchUsers()
      setUsers(userSchema.array().parse(userList))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  // handleAddUser - add a new user row
  const handleAddUser = async (newUser: CreateUserInput) => {
    const createdUser = await createUser(newUser)
    setUsers((prev) => [userSchema.parse(createdUser), ...prev])
  }

  // handleUploadStudents - add uploaded student rows
  const handleUploadStudents = async (students: BulkCreateStudentInput[]) => {
    const createdUsers = await createStudentsBulk(students)
    setUsers((prev) => [...createdUsers.map((user) => userSchema.parse(user)), ...prev])
  }

  // ==================== STATS ====================
  const stats = {
    total: users.length,
    active: users.filter((user) => user.status === 'active').length,
    educators: users.filter((user) => user.userType === 'educator').length,
    students: users.filter((user) => user.userType === 'student').length,
  }

  if (loading) {
    return (
      <div className="flex min-w-0 flex-1 flex-col space-y-6 px-4 md:px-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
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
      <div className="flex min-w-0 flex-1 flex-col space-y-6 px-4 md:px-6">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="outline" className="cursor-pointer" onClick={loadUsers}>
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
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          View and manage user information for educators and students.
        </p>
      </div>

      <div className="flex min-w-0 flex-1 flex-col space-y-6 px-4 md:px-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stats.total}</span>
                    <span className="flex items-center gap-0.5 text-sm text-green-500">
                      <IconArrowUp className="size-3.5" stroke={2} />
                      {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <IconUsersGroup className="size-6" stroke={2} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stats.active}</span>
                    <span className="flex items-center gap-0.5 text-sm text-green-500">
                      <IconArrowUp className="size-3.5" stroke={2} />
                      {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <IconShieldCheck className="size-6" stroke={2} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Educators</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stats.educators}</span>
                    <span className="flex items-center gap-0.5 text-sm text-green-500">
                      <IconArrowUp className="size-3.5" stroke={2} />
                      {stats.total > 0 ? Math.round((stats.educators / stats.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <IconSchool className="size-6" stroke={2} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Students</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stats.students}</span>
                    <span className="flex items-center gap-0.5 text-sm text-orange-500">
                      <IconArrowUp className="size-3.5" stroke={2} />
                      {stats.total > 0 ? Math.round((stats.students / stats.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <IconUserCheck className="size-6" stroke={2} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              View, filter, and manage all user records in one place.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={users}
              columns={columns}
              onAddUser={handleAddUser}
              onUploadStudents={handleUploadStudents}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
