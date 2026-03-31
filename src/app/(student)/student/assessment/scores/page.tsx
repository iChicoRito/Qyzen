import { requireServerAuthContext } from '@/lib/auth/server'
import { fetchStudentQuizReviewList } from '@/lib/supabase/student-quiz'

import { ScoresPageClient } from './components/scores-page-client'

// ScoresPage - load the student scores list page
export default async function ScoresPage() {
  const context = await requireServerAuthContext('student')
  const scores = await fetchStudentQuizReviewList(context.profile.id)

  return <ScoresPageClient scores={scores} />
}
