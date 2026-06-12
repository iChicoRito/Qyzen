import { createClient } from './server'
import { getAssessmentAvailability } from './assessment-availability'
import { fetchStudentAssessmentRetakeGrantMap } from './student-retakes'

export interface StudentAssessmentAttemptItem {
  scoreId: number
  attemptNumber: number
  score: number
  totalQuestions: number
  percentage: number
  status: 'passed' | 'failed'
  submittedAt: string | null
  isBestScore: boolean
}

export interface StudentAssessmentRecord {
  id: string
  assessmentRowId: number
  assessmentCode: string
  subjectName: string
  sectionName: string
  educatorName: string
  educatorUserType: 'educator'
  termName: string
  schedule: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  timeLimitMinutes: number
  questionCount: number
  quizTypeLabel: string
  quizTypes: Array<'multiple_choice' | 'identification'>
  isShuffle: boolean
  allowRetake: boolean
  retakeCount: number
  grantedRetakeCount: number
  effectiveRetakeCount: number
  submittedAttemptCount: number
  remainingRetakes: number
  bestScore: number | null
  bestScoreId: number | null
  latestScoreId: number | null
  canRetake: boolean
  hasQuestions: boolean
  canTake: boolean
  availabilityStatus: 'upcoming' | 'available' | 'expired' | 'invalid'
  availabilityMessage: string
  isScheduleOpen: boolean
  isScheduleLocked: boolean
  isExpiredOverrideActive: boolean
  isFinished: boolean
  scoreId: number | null
  text: string
  statusLabel: 'pending' | 'finished'
  read: boolean
  labels: Array<'pending' | 'finished'>
  attachmentName: string
  attachmentSize: string
  attachmentLabel: string
  attemptHistory: StudentAssessmentAttemptItem[]
}

interface EnrollmentRow {
  subject_id: number
  educator_id: number
  subject: EnrollmentSubjectRow | EnrollmentSubjectRow[] | null
}

interface EnrollmentSubjectRow {
  sections_id: number | null
}

interface AssessmentUserRow {
  given_name: string
  surname: string
  user_type: string
}

interface AssessmentSubjectRow {
  subject_name: string
}

interface AssessmentSectionRow {
  section_name: string
}

interface AssessmentTermRow {
  term_name: string
  semester: string
}

interface AssessmentRow {
  id: number
  assessment_code: string
  subject_id: number
  section_id: number
  educator_id: number
  time_limit: string
  is_shuffle: boolean
  allow_retake: boolean
  retake_count: number
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  subject: AssessmentSubjectRow | AssessmentSubjectRow[] | null
  section: AssessmentSectionRow | AssessmentSectionRow[] | null
  educator: AssessmentUserRow | AssessmentUserRow[] | null
  academic_term: AssessmentTermRow | AssessmentTermRow[] | null
}

interface QuizRow {
  id: number
  assessment_id: number
  quiz_type: 'multiple_choice' | 'identification'
}

interface ScoreRow {
  id: number
  assessment_id: number
  score: number | null
  total_questions: number | null
  submitted_at: string | null
  status: 'in_progress' | 'submitted' | 'passed' | 'failed' | null
}

interface SupabaseErrorResponse {
  message?: string
}

const STATIC_ASSESSMENT_TEXT =
  'This assessment page now shows your enrolled assessment details.\n\nRead each question carefully before submitting your answers. Once you start the quiz, make sure you complete it within the allowed schedule.\n\nGood luck and do your best.'

// getSupabaseErrorMessage - normalize api errors
function getSupabaseErrorMessage(error: SupabaseErrorResponse | null, fallbackMessage: string) {
  return error?.message || fallbackMessage
}

// getSingleRelation - normalize supabase relation arrays
function getSingleRelation<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] || null : value
}

// buildAcademicTermLabel - format term label
function buildAcademicTermLabel(term: AssessmentTermRow | null) {
  if (!term) {
    return 'No term'
  }

  return `${term.term_name} - ${term.semester}`
}

// formatAssessmentSchedule - format assessment date and time
function formatAssessmentSchedule(assessment: Pick<AssessmentRow, 'start_date' | 'start_time' | 'end_date' | 'end_time'>) {
  const startDateTime = new Date(`${assessment.start_date}T${assessment.start_time}`)
  const endDateTime = new Date(`${assessment.end_date}T${assessment.end_time}`)

  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  const startDateLabel = Number.isNaN(startDateTime.getTime())
    ? assessment.start_date
    : dateFormatter.format(startDateTime)
  const endDateLabel = Number.isNaN(endDateTime.getTime())
    ? assessment.end_date
    : dateFormatter.format(endDateTime)
  const startTimeLabel = Number.isNaN(startDateTime.getTime())
    ? assessment.start_time
    : timeFormatter.format(startDateTime)
  const endTimeLabel = Number.isNaN(endDateTime.getTime())
    ? assessment.end_time
    : timeFormatter.format(endDateTime)

  if (startDateLabel === endDateLabel) {
    return `${startDateLabel} | ${startTimeLabel} - ${endTimeLabel}`
  }

  return `${startDateLabel} ${startTimeLabel} - ${endDateLabel} ${endTimeLabel}`
}

// isEducatorUser - validate educator profile relation
function isEducatorUser(user: AssessmentUserRow | null) {
  return user?.user_type?.trim().toLowerCase() === 'educator'
}

// buildQuizTypeLabel - format assessment quiz type summary
function buildQuizTypeLabel(quizTypes: Array<'multiple_choice' | 'identification'>) {
  if (quizTypes.length === 0) {
    return 'No questions yet'
  }

  if (quizTypes.length === 1) {
    return quizTypes[0] === 'multiple_choice' ? 'Multiple Choice' : 'Identification'
  }

  return 'Mixed'
}

// getScorePercentage - compute score percentage
function getScorePercentage(score: Pick<ScoreRow, 'score' | 'total_questions'>) {
  const totalQuestions = score.total_questions || 0

  if (totalQuestions <= 0) {
    return 0
  }

  return Math.round(((score.score || 0) / totalQuestions) * 100)
}

// getBestScore - resolve best submitted score row
function getBestScore(scores: ScoreRow[]) {
  return [...scores]
    .filter((score) => Boolean(score.submitted_at))
    .sort((leftScore, rightScore) => {
      const leftValue = leftScore.score || 0
      const rightValue = rightScore.score || 0

      if (leftValue !== rightValue) {
        return rightValue - leftValue
      }

      return rightScore.id - leftScore.id
    })[0] || null
}

// buildAttemptHistory - map submitted attempts into summary rows
function buildAttemptHistory(scores: ScoreRow[]) {
  const submittedScores = [...scores]
    .filter((score) => Boolean(score.submitted_at))
    .sort((leftScore, rightScore) => {
      const leftTime = new Date(leftScore.submitted_at || '').getTime()
      const rightTime = new Date(rightScore.submitted_at || '').getTime()

      if (leftTime !== rightTime) {
        return leftTime - rightTime
      }

      return leftScore.id - rightScore.id
    })
  const bestScore = getBestScore(submittedScores)

  return submittedScores.map((score, index) => ({
    scoreId: score.id,
    attemptNumber: index + 1,
    score: score.score || 0,
    totalQuestions: score.total_questions || 0,
    percentage: getScorePercentage(score),
    status: score.status === 'passed' ? 'passed' : 'failed',
    submittedAt: score.submitted_at,
    isBestScore: score.id === bestScore?.id,
  })) satisfies StudentAssessmentAttemptItem[]
}

// getRetakeState - compute retake availability
function getRetakeState(assessment: AssessmentRow, scores: ScoreRow[], grantedRetakeCount: number) {
  const submittedScores = scores.filter((score) => Boolean(score.submitted_at))
  const submittedAttemptCount = submittedScores.length
  const assessmentRetakeCount = assessment.allow_retake ? assessment.retake_count : 0
  const effectiveRetakeCount = Math.max(assessmentRetakeCount + grantedRetakeCount, 0)
  const allowRetake = effectiveRetakeCount > 0
  const maxAttempts = effectiveRetakeCount + 1
  const remainingRetakes = Math.max(
    effectiveRetakeCount - Math.max(submittedAttemptCount - 1, 0),
    0
  )
  const canRetake = allowRetake && submittedAttemptCount > 0 && submittedAttemptCount < maxAttempts

  return {
    allowRetake,
    grantedRetakeCount,
    effectiveRetakeCount,
    submittedAttemptCount,
    remainingRetakes,
    canRetake,
  }
}

// mapAssessmentToStudentAssessment - convert assessment row into quiz ui data
function mapAssessmentToStudentAssessment(
  assessment: AssessmentRow,
  index: number,
  quizRows: QuizRow[],
  scores: ScoreRow[],
  grantedRetakeCount: number
): StudentAssessmentRecord {
  const subject = getSingleRelation(assessment.subject)
  const section = getSingleRelation(assessment.section)
  const educator = getSingleRelation(assessment.educator)
  const term = getSingleRelation(assessment.academic_term)
  const quizTypes = [...new Set(quizRows.map((quiz) => quiz.quiz_type))]
  const questionCount = quizRows.length
  const hasQuestions = questionCount > 0
  const submittedScores = scores.filter((score) => Boolean(score.submitted_at))
  const bestScore = getBestScore(submittedScores)
  const latestScore = [...submittedScores].sort((leftScore, rightScore) => rightScore.id - leftScore.id)[0] || null
  const retakeState = getRetakeState(assessment, scores, grantedRetakeCount)
  const hasExpiredOverride = grantedRetakeCount > 0
  const availability = getAssessmentAvailability({
    startDate: assessment.start_date,
    endDate: assessment.end_date,
    startTime: assessment.start_time,
    endTime: assessment.end_time,
    hasExpiredOverride,
  })
  const canTakeWithoutRetake = submittedScores.length === 0
  const isFinished = submittedScores.length > 0
  const statusLabel: StudentAssessmentRecord['statusLabel'] = isFinished ? 'finished' : 'pending'

  return {
    id: String(assessment.id),
    assessmentRowId: assessment.id,
    assessmentCode: assessment.assessment_code,
    subjectName: subject?.subject_name || 'Unknown Subject',
    sectionName: section?.section_name || 'Unknown Section',
    educatorName: `${educator?.given_name || ''} ${educator?.surname || ''}`.trim() || 'Unknown Educator',
    educatorUserType: 'educator',
    termName: buildAcademicTermLabel(term),
    schedule: formatAssessmentSchedule(assessment),
    startDate: assessment.start_date,
    endDate: assessment.end_date,
    startTime: assessment.start_time,
    endTime: assessment.end_time,
    timeLimitMinutes: Number(assessment.time_limit) || 0,
    questionCount,
    quizTypeLabel: buildQuizTypeLabel(quizTypes),
    quizTypes,
    isShuffle: assessment.is_shuffle,
    allowRetake: retakeState.allowRetake,
    retakeCount: retakeState.effectiveRetakeCount,
    grantedRetakeCount: retakeState.grantedRetakeCount,
    effectiveRetakeCount: retakeState.effectiveRetakeCount,
    submittedAttemptCount: retakeState.submittedAttemptCount,
    remainingRetakes: retakeState.remainingRetakes,
    bestScore: bestScore?.score ?? null,
    bestScoreId: bestScore?.id ?? null,
    latestScoreId: latestScore?.id ?? null,
    canRetake: retakeState.canRetake,
    hasQuestions,
    canTake: hasQuestions && availability.isScheduleOpen && (canTakeWithoutRetake || retakeState.canRetake),
    availabilityStatus: availability.availabilityStatus,
    availabilityMessage: availability.availabilityMessage,
    isScheduleOpen: availability.isScheduleOpen,
    isScheduleLocked: availability.isScheduleLocked,
    isExpiredOverrideActive: availability.isExpiredOverrideActive,
    isFinished,
    scoreId: bestScore?.id ?? null,
    text: STATIC_ASSESSMENT_TEXT,
    statusLabel,
    read: index === 0,
    labels: [statusLabel],
    attachmentName: 'Study material coming soon',
    attachmentSize: 'Static',
    attachmentLabel: 'Assessment Study Material',
    attemptHistory: buildAttemptHistory(submittedScores),
  }
}

// fetchStudentAssessments - load enrolled assessments for a student
export async function fetchStudentAssessments(studentId: number) {
  const supabase = await createClient()
  const { data: enrollmentData, error: enrollmentError } = await supabase
    .from('tbl_enrolled')
    .select('subject_id,educator_id,subject:subject_id(sections_id)')
    .eq('student_id', studentId)
    .eq('is_active', true)

  if (enrollmentError) {
    throw new Error(getSupabaseErrorMessage(enrollmentError, 'Failed to load student enrollments.'))
  }

  const enrollments = (enrollmentData || []) as EnrollmentRow[]
  const enrollmentKeys = new Set(
    enrollments
      .map((enrollment) => {
        const subject = getSingleRelation(enrollment.subject)

        if (subject?.sections_id === null || subject?.sections_id === undefined) {
          return null
        }

        return `${enrollment.subject_id}:${subject.sections_id}:${enrollment.educator_id}`
      })
      .filter((value): value is string => Boolean(value))
  )

  if (enrollmentKeys.size === 0) {
    return [] as StudentAssessmentRecord[]
  }

  const subjectIds = [...new Set(enrollments.map((enrollment) => enrollment.subject_id))]
  const sectionIds = [
    ...new Set(
      enrollments
        .map((enrollment) => getSingleRelation(enrollment.subject)?.sections_id ?? null)
        .filter((sectionId): sectionId is number => sectionId !== null)
    ),
  ]
  const educatorIds = [...new Set(enrollments.map((enrollment) => enrollment.educator_id))]

  const { data: assessmentData, error: assessmentError } = await supabase
    .from('tbl_assessments')
    .select(
      'id,assessment_code,subject_id,section_id,educator_id,time_limit,is_shuffle,allow_retake,retake_count,start_date,end_date,start_time,end_time,subject:subject_id(subject_name),section:section_id(section_name),educator:educator_id(given_name,surname,user_type),academic_term:term(term_name,semester)'
    )
    .in('subject_id', subjectIds)
    .in('section_id', sectionIds)
    .in('educator_id', educatorIds)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (assessmentError) {
    throw new Error(getSupabaseErrorMessage(assessmentError, 'Failed to load student assessments.'))
  }

  const enrolledAssessments = ((assessmentData || []) as AssessmentRow[]).filter((assessment) =>
    enrollmentKeys.has(`${assessment.subject_id}:${assessment.section_id}:${assessment.educator_id}`) &&
    isEducatorUser(getSingleRelation(assessment.educator))
  )

  if (enrolledAssessments.length === 0) {
    return [] as StudentAssessmentRecord[]
  }

  const assessmentIds = enrolledAssessments.map((assessment) => assessment.id)
  const retakeGrantMap = await fetchStudentAssessmentRetakeGrantMap(studentId, assessmentIds)
  const [{ data: quizData, error: quizError }, { data: scoreData, error: scoreError }] =
    await Promise.all([
      supabase
        .from('tbl_quizzes')
        .select('id,assessment_id,quiz_type')
        .in('assessment_id', assessmentIds),
      supabase
        .from('tbl_scores')
        .select('id,assessment_id,score,total_questions,submitted_at,status')
        .eq('student_id', studentId)
        .in('assessment_id', assessmentIds)
        .order('id', { ascending: false }),
    ])

  if (quizError) {
    throw new Error(getSupabaseErrorMessage(quizError, 'Failed to load assessment questions.'))
  }

  if (scoreError) {
    throw new Error(getSupabaseErrorMessage(scoreError, 'Failed to load assessment progress.'))
  }

  const quizMap = ((quizData || []) as QuizRow[]).reduce<Map<number, QuizRow[]>>((result, quiz) => {
    const currentRows = result.get(quiz.assessment_id) || []
    currentRows.push(quiz)
    result.set(quiz.assessment_id, currentRows)
    return result
  }, new Map<number, QuizRow[]>())
  const scoreMap = ((scoreData || []) as ScoreRow[]).reduce<Map<number, ScoreRow[]>>((result, score) => {
    const currentRows = result.get(score.assessment_id) || []
    currentRows.push(score)
    result.set(score.assessment_id, currentRows)
    return result
  }, new Map<number, ScoreRow[]>())
  const sortedAssessments = [...enrolledAssessments].sort((leftAssessment, rightAssessment) => {
    const leftScores = scoreMap.get(leftAssessment.id) || []
    const rightScores = scoreMap.get(rightAssessment.id) || []
    const leftFinished = leftScores.some((score) => Boolean(score.submitted_at))
    const rightFinished = rightScores.some((score) => Boolean(score.submitted_at))

    if (leftFinished !== rightFinished) {
      return leftFinished ? 1 : -1
    }

    return rightAssessment.id - leftAssessment.id
  })

  return sortedAssessments.map((assessment, index) =>
    mapAssessmentToStudentAssessment(
      assessment,
      index,
      quizMap.get(assessment.id) || [],
      scoreMap.get(assessment.id) || [],
      retakeGrantMap.get(assessment.id) || 0
    )
  )
}

