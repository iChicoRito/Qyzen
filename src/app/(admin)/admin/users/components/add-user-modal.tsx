"use client"

import { useState } from "react"
import { IconPlus } from "@tabler/icons-react"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { statuses, userTypes } from "../data/data"
import type { User } from "../data/schema"

const userFormSchema = z.object({
  id: z.string().min(1, "User ID is required"),
  givenName: z.string().min(1, "Given name is required"),
  surname: z.string().min(1, "Surname is required"),
  email: z.string().email("A valid email is required"),
  status: z.string(),
  userType: z.string(),
}).superRefine((data, ctx) => {
  const studentPattern = /^\d{4}-\d{5}$/
  const instructorPattern = /^\d{4}-\d{4}$/

  if (data.userType === "student" && !studentPattern.test(data.id)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["id"],
      message: "Student ID must use the format YYYY-#####",
    })
  }

  if (data.userType === "instructor" && !instructorPattern.test(data.id)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["id"],
      message: "Instructor ID must use the format YYYY-####",
    })
  }
})

type UserFormData = z.infer<typeof userFormSchema>

interface AddUserModalProps {
  onAddUser?: (user: User) => void
  trigger?: React.ReactNode
}

export function AddUserModal({ onAddUser, trigger }: AddUserModalProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<UserFormData>({
    id: "",
    givenName: "",
    surname: "",
    email: "",
    status: "active",
    userType: "student",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const validatedData = userFormSchema.parse(formData)

      const newUser: User = {
        id: validatedData.id,
        givenName: validatedData.givenName,
        surname: validatedData.surname,
        email: validatedData.email,
        status: validatedData.status,
        userType: validatedData.userType,
      }

      onAddUser?.(newUser)
      toast.success("User added successfully", {
        description: `${newUser.givenName} ${newUser.surname} has been created.`,
      })

      setFormData({
        id: "",
        givenName: "",
        surname: "",
        email: "",
        status: "active",
        userType: "student",
      })
      setErrors({})
      setOpen(false)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.issues.forEach((issue) => {
          if (issue.path[0]) {
            newErrors[issue.path[0] as string] = issue.message
          }
        })
        setErrors(newErrors)
      }
    }
  }

  const handleCancel = () => {
    setFormData({
      id: "",
      givenName: "",
      surname: "",
      email: "",
      status: "active",
      userType: "student",
    })
    setErrors({})
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default" size="sm" className="cursor-pointer">
            <IconPlus className="h-4 w-4" stroke={2} />
            Add User
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user record with a given name, surname, status, and user type.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="id">User ID *</Label>
              <Input
                id="id"
                placeholder={formData.userType === "student" ? "2025-47263" : "2024-2260"}
                value={formData.id}
                onChange={(e) => setFormData((prev) => ({ ...prev, id: e.target.value }))}
                className={errors.id ? "border-red-500" : ""}
              />
              {errors.id && (
                <p className="text-sm text-red-500">{errors.id}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="givenName">Given Name *</Label>
              <Input
                id="givenName"
                placeholder="Enter given name"
                value={formData.givenName}
                onChange={(e) => setFormData((prev) => ({ ...prev, givenName: e.target.value }))}
                className={errors.givenName ? "border-red-500" : ""}
              />
              {errors.givenName && (
                <p className="text-sm text-red-500">{errors.givenName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="surname">Surname *</Label>
              <Input
                id="surname"
                placeholder="Enter surname"
                value={formData.surname}
                onChange={(e) => setFormData((prev) => ({ ...prev, surname: e.target.value }))}
                className={errors.surname ? "border-red-500" : ""}
              />
              {errors.surname && (
                <p className="text-sm text-red-500">{errors.surname}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center">
                        {status.icon && (
                          <status.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                        )}
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="userType">User Type</Label>
              <Select
                value={formData.userType}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, userType: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select user type" />
                </SelectTrigger>
                <SelectContent>
                  {userTypes.map((userType) => (
                    <SelectItem key={userType.value} value={userType.value}>
                      {userType.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel} className="cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" className="cursor-pointer">
              <IconPlus className="mr-2 h-4 w-4" stroke={2} />
              Create User
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
