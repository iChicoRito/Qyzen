'use client'

import { Button } from '@/components/ui/button'

import type { Task } from '../data/schema'

interface AddTaskModalProps {
  onAddTask?: (task: Task) => void
  trigger?: React.ReactNode
}

// AddTaskModal - keep the legacy prototype files type-safe while the route uses the new materials flow
export function AddTaskModal({ onAddTask, trigger }: AddTaskModalProps) {
  return (
    <>
      {trigger || (
        <Button type="button" disabled variant="outline">
          Prototype Only
        </Button>
      )}
      <span className="sr-only">{Boolean(onAddTask)}</span>
    </>
  )
}
