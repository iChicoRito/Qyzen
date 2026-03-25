import { IconCircleOff, IconShieldCheck } from "@tabler/icons-react"

export const userTypes = [
  {
    value: "instructor",
    label: "Instructor",
  },
  {
    value: "student",
    label: "Student",
  },
]

export const statuses = [
  {
    value: "active",
    label: "Active",
    icon: IconShieldCheck,
  },
  {
    value: "inactive",
    label: "Inactive",
    icon: IconCircleOff,
  },
]
