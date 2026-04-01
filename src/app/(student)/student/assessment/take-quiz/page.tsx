import { redirect } from 'next/navigation'

import { requireServerAuthContext } from '@/lib/auth/server'
import { fetchStudentQuizSession } from '@/lib/supabase/student-quiz'

import { TakeQuizPageClient } from './components/take-quiz-page-client'

interface TakeQuizPageProps {
  searchParams: Promise<{
    moduleId?: string
  }>
}

// TakeQuizPage - render student actual quiz route
export default async function TakeQuizPage({ searchParams }: TakeQuizPageProps) {
  // ==================== LOAD DATA ====================
  const params = await searchParams
  const moduleId = Number(params.moduleId)

  if (!Number.isFinite(moduleId)) {
    redirect('/student/assessment/quiz')
  }

  const context = await requireServerAuthContext('student')
  let session: Awaited<ReturnType<typeof fetchStudentQuizSession>>

  try {
    session = await fetchStudentQuizSession(context.profile.id, moduleId)
  } catch {
    redirect('/student/assessment/quiz')
  }

  if (!session.hasInProgressAttempt && !session.canTake && session.bestScoreId) {
    redirect(`/student/assessment/take-quiz/result?scoreId=${session.bestScoreId}`)
  }

  // ==================== RENDER ====================
  return (
    <div className="@container/main flex flex-1 flex-col">
      <TakeQuizPageClient session={session} />
    </div>
  )
}
