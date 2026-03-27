'use client'

import { IconLoader2 } from '@tabler/icons-react'

interface SpinnerProps {
  className?: string
}

// Spinner - reusable loading spinner
export function Spinner({ className }: SpinnerProps) {
  return <IconLoader2 className={`animate-spin ${className || ''}`.trim()} stroke={2} />
}
