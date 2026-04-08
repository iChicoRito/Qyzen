import { createClient } from '@/lib/supabase/server'
import {
  buildAdminDashboardAnalytics,
  type AdminDashboardSource,
  type AdminEnrollmentRow,
  type AdminModuleRow,
  type AdminScoreRow,
  type AdminSectionRow,
  type AdminSubjectRow,
  type AdminUserRow,
} from '@/lib/supabase/admin-dashboard-helpers'

// fetchAdminDashboardAnalytics - load and shape admin dashboard analytics
export async function fetchAdminDashboardAnalytics() {
  const supabase = await createClient()

  const [
    { data: usersData, error: usersError },
    { data: sectionsData, error: sectionsError },
    { data: subjectsData, error: subjectsError },
    { data: modulesData, error: modulesError },
    { data: enrollmentsData, error: enrollmentsError },
    { data: scoresData, error: scoresError },
  ] = await Promise.all([
    supabase
      .from('tbl_users')
      .select('id,user_type,user_id,given_name,surname,email,is_active,deleted_at'),
    supabase.from('tbl_sections').select('id,educator_id,section_name,is_active'),
    supabase.from('tbl_subjects').select('id,educator_id,sections_id,subject_name,subject_code,is_active'),
    supabase.from('tbl_modules').select('id,educator_id,subject_id,section_id,module_code,is_active'),
    supabase.from('tbl_enrolled').select('id,student_id,educator_id,subject_id,is_active,created_at'),
    supabase
      .from('tbl_scores')
      .select(
        'id,student_id,educator_id,module_id,subject_id,section_id,score,total_questions,status,is_passed,submitted_at,created_at'
      ),
  ])

  if (usersError) {
    throw new Error(usersError.message || 'Failed to load dashboard users.')
  }

  if (sectionsError) {
    throw new Error(sectionsError.message || 'Failed to load dashboard sections.')
  }

  if (subjectsError) {
    throw new Error(subjectsError.message || 'Failed to load dashboard subjects.')
  }

  if (modulesError) {
    throw new Error(modulesError.message || 'Failed to load dashboard assessments.')
  }

  if (enrollmentsError) {
    throw new Error(enrollmentsError.message || 'Failed to load dashboard enrollments.')
  }

  if (scoresError) {
    throw new Error(scoresError.message || 'Failed to load dashboard scores.')
  }

  const source: AdminDashboardSource = {
    users: (usersData || []) as AdminUserRow[],
    sections: (sectionsData || []) as AdminSectionRow[],
    subjects: (subjectsData || []) as AdminSubjectRow[],
    modules: (modulesData || []) as AdminModuleRow[],
    enrollments: (enrollmentsData || []) as AdminEnrollmentRow[],
    scores: (scoresData || []) as AdminScoreRow[],
  }

  return buildAdminDashboardAnalytics(source)
}
