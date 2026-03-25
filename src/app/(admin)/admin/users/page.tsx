"use client"

import { useEffect, useState } from "react"
import { z } from "zod"
import {
  IconArrowUp,
  IconSchool,
  IconShieldCheck,
  IconUserCheck,
  IconUsersGroup,
} from "@tabler/icons-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { columns } from "./components/columns"
import { DataTable } from "./components/data-table"
import { userSchema, type User } from "./data/schema"
import tasksData from "./data/user.json"

async function getUsers() {
  return z.array(userSchema).parse(tasksData)
}

export default function UsersPage() {
  const [users, setUsers] = useState<z.infer<typeof userSchema>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const userList = await getUsers()
        setUsers(userList)
      } catch (error) {
        console.error("Failed to load users:", error)
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  const handleAddUser = (newUser: User) => {
    setUsers((prev) => [newUser, ...prev])
  }

  const stats = {
    total: users.length,
    active: users.filter((user) => user.status === "active").length,
    instructors: users.filter((user) => user.userType === "instructor").length,
    students: users.filter((user) => user.userType === "student").length,
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-muted-foreground">Loading users...</div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-2 px-4 md:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">
          View and manage user information for instructors and students.
        </p>
      </div>

      <div className="px-4 md:hidden md:px-6">
        <div className="flex h-96 items-center justify-center rounded-lg border bg-muted/20">
          <div className="p-8 text-center">
            <h3 className="mb-2 text-lg font-semibold">Users Dashboard</h3>
            <p className="text-muted-foreground">
              Please use a larger screen to view the full user management interface.
            </p>
          </div>
        </div>
      </div>

      <div className="hidden h-full flex-1 flex-col space-y-6 px-4 md:flex md:px-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Users</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stats.total}</span>
                    <span className="flex items-center gap-0.5 text-sm text-green-500">
                      <IconArrowUp className="size-3.5" stroke={2} />
                      {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <IconUsersGroup className="size-6" stroke={2} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Active Users</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stats.active}</span>
                    <span className="flex items-center gap-0.5 text-sm text-green-500">
                      <IconArrowUp className="size-3.5" stroke={2} />
                      {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <IconShieldCheck className="size-6" stroke={2} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Instructors</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stats.instructors}</span>
                    <span className="flex items-center gap-0.5 text-sm text-green-500">
                      <IconArrowUp className="size-3.5" stroke={2} />
                      {stats.total > 0 ? Math.round((stats.instructors / stats.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <IconSchool className="size-6" stroke={2} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Students</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stats.students}</span>
                    <span className="flex items-center gap-0.5 text-sm text-orange-500">
                      <IconArrowUp className="size-3.5" stroke={2} />
                      {stats.total > 0 ? Math.round((stats.students / stats.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="bg-secondary rounded-lg p-3">
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
            <DataTable data={users} columns={columns} onAddUser={handleAddUser} />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
