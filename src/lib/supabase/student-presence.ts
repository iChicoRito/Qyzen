'use client'

import { createClient } from './client'

export const STUDENT_PRESENCE_HEARTBEAT_INTERVAL_MS = 25000
export const STUDENT_PRESENCE_FRESHNESS_MS = 60000

interface UpsertStudentPresenceInput {
  studentId: number
  currentPath: string
}

interface DeleteStudentPresenceInput {
  studentId: number
}

// buildStudentPresencePayload - create the upsert payload
function buildStudentPresencePayload(input: UpsertStudentPresenceInput) {
  const timestamp = new Date().toISOString()

  return {
    student_id: input.studentId,
    current_path: input.currentPath,
    last_seen_at: timestamp,
    updated_at: timestamp,
    created_at: timestamp,
  }
}

// upsertStudentPresence - save the latest student heartbeat
export async function upsertStudentPresence(input: UpsertStudentPresenceInput) {
  const supabase = createClient()
  const { error } = await supabase.from('tbl_student_presence').upsert(
    buildStudentPresencePayload(input),
    {
      onConflict: 'student_id',
    }
  )

  if (error) {
    throw new Error(error.message || 'Failed to update student presence.')
  }
}

// deleteStudentPresence - remove the current student presence row
export async function deleteStudentPresence(input: DeleteStudentPresenceInput) {
  const supabase = createClient()
  const { error } = await supabase
    .from('tbl_student_presence')
    .delete()
    .eq('student_id', input.studentId)

  if (error) {
    throw new Error(error.message || 'Failed to clear student presence.')
  }
}
