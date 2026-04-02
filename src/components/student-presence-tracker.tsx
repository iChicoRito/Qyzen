'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

import {
  STUDENT_PRESENCE_HEARTBEAT_INTERVAL_MS,
  upsertStudentPresence,
} from '@/lib/supabase/student-presence'

interface StudentPresenceTrackerProps {
  studentId: number
}

// StudentPresenceTracker - keep the current student online heartbeat fresh
export function StudentPresenceTracker({ studentId }: StudentPresenceTrackerProps) {
  // ==================== SETUP ====================
  const pathname = usePathname()
  const isSyncingRef = useRef(false)

  // ==================== SEND HEARTBEAT ====================
  // syncPresence - upsert the latest student presence row
  const syncPresence = async () => {
    if (isSyncingRef.current) {
      return
    }

    isSyncingRef.current = true

    try {
      await upsertStudentPresence({
        studentId,
        currentPath: pathname || '/student',
      })
    } catch {
      // keep the tracker silent
    } finally {
      isSyncingRef.current = false
    }
  }

  // ==================== HEARTBEAT EFFECT ====================
  useEffect(() => {
    void syncPresence()

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void syncPresence()
      }
    }, STUDENT_PRESENCE_HEARTBEAT_INTERVAL_MS)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void syncPresence()
      }
    }

    const handleWindowFocus = () => {
      void syncPresence()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleWindowFocus)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [pathname, studentId])

  return null
}
