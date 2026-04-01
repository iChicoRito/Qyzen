import { createClient } from './server'

interface StudentModuleRetakeRow {
  module_id: number
  extra_retake_count: number
  is_active: boolean
}

interface SupabaseErrorResponse {
  message?: string
}

// getSupabaseErrorMessage - normalize api errors
function getSupabaseErrorMessage(error: SupabaseErrorResponse | null, fallbackMessage: string) {
  return error?.message || fallbackMessage
}

// fetchStudentModuleRetakeGrantMap - load active educator retake grants per module
export async function fetchStudentModuleRetakeGrantMap(studentId: number, moduleIds: number[]) {
  if (moduleIds.length === 0) {
    return new Map<number, number>()
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tbl_student_module_retakes')
    .select('module_id,extra_retake_count,is_active')
    .eq('student_id', studentId)
    .eq('is_active', true)
    .in('module_id', moduleIds)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load granted retake data.'))
  }

  return ((data || []) as StudentModuleRetakeRow[]).reduce<Map<number, number>>((result, row) => {
    result.set(row.module_id, row.is_active ? Math.max(row.extra_retake_count, 0) : 0)
    return result
  }, new Map<number, number>())
}

// fetchStudentModuleRetakeGrant - load one active retake grant
export async function fetchStudentModuleRetakeGrant(studentId: number, moduleId: number) {
  const retakeGrantMap = await fetchStudentModuleRetakeGrantMap(studentId, [moduleId])
  return retakeGrantMap.get(moduleId) || 0
}
