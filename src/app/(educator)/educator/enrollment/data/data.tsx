import type { ComponentType } from "react"
import {
  CheckCircle2,
  Circle,
  Clock,
  PlayCircle,
} from "lucide-react"

type TaskOption = {
  value: string
  label: string
  icon?: ComponentType<{ className?: string }>
}

export const categories: TaskOption[] = [
  {
    value: "bug",
    label: "Bug",
  },
  {
    value: "feature",
    label: "Feature",
  },
  {
    value: "documentation",
    label: "Docs",
  },
  {
    value: "improvement",
    label: "Improvement",
  },
  {
    value: "refactor",
    label: "Refactor",
  },
]

export const statuses: TaskOption[] = [
  {
    value: "pending",
    label: "Pending",
    icon: Clock,
  },
  {
    value: "todo",
    label: "Todo",
    icon: Circle,
  },
  {
    value: "in progress",
    label: "In Progress",
    icon: PlayCircle,
  },
  {
    value: "completed",
    label: "Completed",
    icon: CheckCircle2,
  },
]

export const priorities: TaskOption[] = [
  {
    label: "Minor",
    value: "minor"
  },
  {
    label: "Normal",
    value: "normal"
  },
  {
    label: "Important",
    value: "important"
  },
  {
    label: "Critical",
    value: "critical"
  },
]
