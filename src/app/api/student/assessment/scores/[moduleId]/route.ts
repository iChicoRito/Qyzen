import { NextResponse } from 'next/server'

import { fetchAuthContext } from '@/lib/auth/auth-context'
import {
  QUIZ_RESULT_PASSING_PERCENTAGE,
  fetchStudentQuizGradingSession,
} from '@/lib/supabase/student-quiz'
import { createClient } from '@/lib/supabase/server'
import { studentQuizAttemptSchema } from '@/lib/validations/student-quiz.schema'

interface RouteContext {
  params: Promise<{
    moduleId: string
  }>
}

interface ScoreMutationRow {
  id: number
  taken_at: string | null
  submitted_at: string | null
}

interface ScoreRecord {
  id: number
  taken_at: string | null
}

// getStudentApiContext - validate authenticated student session
async function getStudentApiContext() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return null
  }

  const context = await fetchAuthContext(supabase, user)

  if (context.role !== 'student' || !context.isActive || !context.isEmailVerified) {
    return null
  }

  return {
    supabase,
    context,
  }
}

// getExistingScoreRecord - load existing score record for module
async function getExistingScoreRecord(studentId: number, moduleId: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tbl_scores')
    .select('id,taken_at')
    .eq('student_id', studentId)
    .eq('module_id', moduleId)
    .order('id', { ascending: false })
    .limit(1)

  if (error) {
    throw new Error(error.message || 'Failed to load score record.')
  }

  return ((data || []) as ScoreRecord[])[0] || null
}

// normalizeAnswerValue - normalize answer text for score comparison
function normalizeAnswerValue(value: string) {
  return value.trim().toLowerCase()
}

// calculateScore - evaluate student answers server-side
function calculateScore(
  answers: Record<string, string>,
  questions: Awaited<ReturnType<typeof fetchStudentQuizGradingSession>>['questions']
) {
  return questions.reduce((score, question) => {
    const studentAnswer = normalizeAnswerValue(answers[String(question.id)] || '')

    if (!studentAnswer) {
      return score
    }

    if (question.quizType === 'multiple_choice') {
      return studentAnswer === normalizeAnswerValue(question.correctAnswer) ? score + 1 : score
    }

    return question.correctAnswers.some(
      (correctAnswer) => normalizeAnswerValue(correctAnswer) === studentAnswer
    )
      ? score + 1
      : score
  }, 0)
}

// saveDraftScore - insert or update draft answers
async function saveDraftScore(
  studentId: number,
  gradingSession: Awaited<ReturnType<typeof fetchStudentQuizGradingSession>>,
  answers: Record<string, string>,
  warningAttempts: number
) {
  const supabase = await createClient()
  const existingScore = await getExistingScoreRecord(studentId, gradingSession.moduleRowId)
  const draftPayload = {
    student_id: studentId,
    educator_id: gradingSession.educatorId,
    module_id: gradingSession.moduleRowId,
    subject_id: gradingSession.subjectId,
    section_id: gradingSession.sectionId,
    student_answer: answers,
    warning_attempts: warningAttempts,
    score: null,
    total_questions: gradingSession.questions.length,
    status: 'in_progress',
    is_passed: false,
    taken_at: existingScore?.taken_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  if (existingScore) {
    const { data, error } = await supabase
      .from('tbl_scores')
      .update(draftPayload)
      .eq('id', existingScore.id)
      .select('id,taken_at,submitted_at')
      .single()

    if (error) {
      throw new Error(error.message || 'Failed to save draft score.')
    }

    return data as ScoreMutationRow
  }

  const { data, error } = await supabase
    .from('tbl_scores')
    .insert({
      ...draftPayload,
      created_at: new Date().toISOString(),
    })
    .select('id,taken_at,submitted_at')
    .single()

  if (error) {
    throw new Error(error.message || 'Failed to create draft score.')
  }

  return data as ScoreMutationRow
}

// submitScore - finalize quiz score and result
async function submitScore(
  studentId: number,
  gradingSession: Awaited<ReturnType<typeof fetchStudentQuizGradingSession>>,
  answers: Record<string, string>,
  warningAttempts: number
) {
  const supabase = await createClient()
  const existingScore = await getExistingScoreRecord(studentId, gradingSession.moduleRowId)
  const score = calculateScore(answers, gradingSession.questions)
  const totalQuestions = gradingSession.questions.length
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0
  const isPassed = percentage >= QUIZ_RESULT_PASSING_PERCENTAGE
  const submittedAt = new Date().toISOString()
  const submissionPayload = {
    student_id: studentId,
    educator_id: gradingSession.educatorId,
    module_id: gradingSession.moduleRowId,
    subject_id: gradingSession.subjectId,
    section_id: gradingSession.sectionId,
    student_answer: answers,
    warning_attempts: warningAttempts,
    score,
    total_questions: totalQuestions,
    status: isPassed ? 'passed' : 'failed',
    is_passed: isPassed,
    taken_at: existingScore?.taken_at || gradingSession.takenAt || submittedAt,
    submitted_at: submittedAt,
    updated_at: submittedAt,
  }

  if (existingScore) {
    const { data, error } = await supabase
      .from('tbl_scores')
      .update(submissionPayload)
      .eq('id', existingScore.id)
      .select('id,taken_at,submitted_at')
      .single()

    if (error) {
      throw new Error(error.message || 'Failed to submit score.')
    }

    return {
      ...(data as ScoreMutationRow),
      score,
      totalQuestions,
      percentage,
      isPassed,
      status: isPassed ? 'passed' : 'failed',
    }
  }

  const { data, error } = await supabase
    .from('tbl_scores')
    .insert({
      ...submissionPayload,
      created_at: submittedAt,
    })
    .select('id,taken_at,submitted_at')
    .single()

  if (error) {
    throw new Error(error.message || 'Failed to create submitted score.')
  }

  return {
    ...(data as ScoreMutationRow),
    score,
    totalQuestions,
    percentage,
    isPassed,
    status: isPassed ? 'passed' : 'failed',
  }
}

// POST - save draft answers or submit student score
export async function POST(request: Request, context: RouteContext) {
  try {
    const authContext = await getStudentApiContext()

    if (!authContext) {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 })
    }

    const { moduleId } = await context.params
    const parsedModuleId = Number(moduleId)

    if (!Number.isFinite(parsedModuleId)) {
      return NextResponse.json({ message: 'Invalid module id.' }, { status: 400 })
    }

    const payload = studentQuizAttemptSchema.parse(await request.json())
    const gradingSession = await fetchStudentQuizGradingSession(
      authContext.context.profile.id,
      parsedModuleId
    )

    if (gradingSession.submittedAt) {
      return NextResponse.json(
        { message: 'This assessment has already been submitted and cannot be retaken.' },
        { status: 409 }
      )
    }

    if (payload.mode === 'draft') {
      const draftScore = await saveDraftScore(
        authContext.context.profile.id,
        gradingSession,
        payload.answers,
        payload.warningAttempts
      )

      return NextResponse.json({
        scoreId: draftScore.id,
        takenAt: draftScore.taken_at,
        submittedAt: draftScore.submitted_at,
      })
    }

    const submittedScore = await submitScore(
      authContext.context.profile.id,
      gradingSession,
      payload.answers,
      payload.warningAttempts
    )

    return NextResponse.json({
      ...submittedScore,
      scoreId: submittedScore.id,
    })
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'Failed to save quiz attempt.',
      },
      { status: 400 }
    )
  }
}
