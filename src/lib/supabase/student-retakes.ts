import { createClient } from './server'

interface StudentAssessmentRetakeRow {
  assessment_id: number
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

// fetchStudentAssessmentRetakeGrantMap - load active educator retake grants per assessment
export async function fetchStudentAssessmentRetakeGrantMap(studentId: number, assessmentIds: number[]) {
  if (assessmentIds.length === 0) {
    return new Map<number, number>()
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tbl_student_assessment_retakes')
    .select('assessment_id,extra_retake_count,is_active')
    .eq('student_id', studentId)
    .eq('is_active', true)
    .in('assessment_id', assessmentIds)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load granted retake data.'))
  }

  return ((data || []) as StudentAssessmentRetakeRow[]).reduce<Map<number, number>>((result, row) => {
    result.set(row.assessment_id, row.is_active ? Math.max(row.extra_retake_count, 0) : 0)
    return result
  }, new Map<number, number>())
}

// fetchStudentAssessmentRetakeGrant - load one active retake grant
export async function fetchStudentAssessmentRetakeGrant(studentId: number, assessmentId: number) {
  const retakeGrantMap = await fetchStudentAssessmentRetakeGrantMap(studentId, [assessmentId])
  return retakeGrantMap.get(assessmentId) || 0
}

