import { Quiz } from './components/quiz'
import { requireServerAuthContext } from '@/lib/auth/server'
import { fetchStudentAssessments } from '@/lib/supabase/student-assessments'

// QuizPage - renders the quiz assessment prototype
export default async function QuizPage() {
  // ==================== LOAD DATA ====================
  const context = await requireServerAuthContext('student')
  const quizzes = await fetchStudentAssessments(context.profile.id)

  // ==================== RENDER ====================
  return (
    <div className="@container/main flex flex-1 flex-col">
      <div className="min-h-[calc(100vh-4rem)] px-4 pb-4 md:h-[calc(100vh-4rem)] md:px-6 md:pb-0">
        <Quiz quizzes={quizzes} defaultLayout={[42, 58]} />
      </div>
    </div>
  )
}
