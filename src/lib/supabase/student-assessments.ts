import { createClient } from './server'

export interface StudentAssessmentRecord {
  id: string
  moduleRowId: number
  moduleCode: string
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
  hasQuestions: boolean
  canTake: boolean
  isFinished: boolean
  scoreId: number | null
  text: string
  statusLabel: 'pending' | 'finished'
  read: boolean
  labels: Array<'pending' | 'finished'>
  attachmentName: string
  attachmentSize: string
  attachmentLabel: string
}

interface EnrollmentRow {
  subject_id: number
  educator_id: number
  subject: EnrollmentSubjectRow | EnrollmentSubjectRow[] | null
}

interface EnrollmentSubjectRow {
  sections_id: number | null
}

interface ModuleUserRow {
  given_name: string
  surname: string
  user_type: string
}

interface ModuleSubjectRow {
  subject_name: string
}

interface ModuleSectionRow {
  section_name: string
}

interface ModuleTermRow {
  term_name: string
  semester: string
}

interface ModuleRow {
  id: number
  module_id: string
  module_code: string
  subject_id: number
  section_id: number
  educator_id: number
  time_limit: string
  is_shuffle: boolean
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  subject: ModuleSubjectRow | ModuleSubjectRow[] | null
  section: ModuleSectionRow | ModuleSectionRow[] | null
  educator: ModuleUserRow | ModuleUserRow[] | null
  academic_term: ModuleTermRow | ModuleTermRow[] | null
}

interface QuizRow {
  id: number
  module_id: number
  quiz_type: 'multiple_choice' | 'identification'
}

interface ScoreRow {
  id: number
  module_id: number
  submitted_at: string | null
}

interface SupabaseErrorResponse {
  message?: string
}

const STATIC_ASSESSMENT_TEXT =
  'This assessment page now shows your enrolled module details.\n\nRead each question carefully before submitting your answers. Once you start the quiz, make sure you complete it within the allowed schedule.\n\nGood luck and do your best.'

// getSupabaseErrorMessage - normalize api errors
function getSupabaseErrorMessage(error: SupabaseErrorResponse | null, fallbackMessage: string) {
  return error?.message || fallbackMessage
}

// getSingleRelation - normalize supabase relation arrays
function getSingleRelation<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] || null : value
}

// buildAcademicTermLabel - format term label
function buildAcademicTermLabel(term: ModuleTermRow | null) {
  if (!term) {
    return 'No term'
  }

  return `${term.term_name} - ${term.semester}`
}

// formatModuleSchedule - format module date and time
function formatModuleSchedule(module: Pick<ModuleRow, 'start_date' | 'start_time' | 'end_date' | 'end_time'>) {
  const startDateTime = new Date(`${module.start_date}T${module.start_time}`)
  const endDateTime = new Date(`${module.end_date}T${module.end_time}`)

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
    ? module.start_date
    : dateFormatter.format(startDateTime)
  const endDateLabel = Number.isNaN(endDateTime.getTime())
    ? module.end_date
    : dateFormatter.format(endDateTime)
  const startTimeLabel = Number.isNaN(startDateTime.getTime())
    ? module.start_time
    : timeFormatter.format(startDateTime)
  const endTimeLabel = Number.isNaN(endDateTime.getTime())
    ? module.end_time
    : timeFormatter.format(endDateTime)

  if (startDateLabel === endDateLabel) {
    return `${startDateLabel} | ${startTimeLabel} - ${endTimeLabel}`
  }

  return `${startDateLabel} ${startTimeLabel} - ${endDateLabel} ${endTimeLabel}`
}

// isEducatorUser - validate educator profile relation
function isEducatorUser(user: ModuleUserRow | null) {
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

// mapModuleToStudentAssessment - convert module row into quiz ui data
function mapModuleToStudentAssessment(
  module: ModuleRow,
  index: number,
  quizRows: QuizRow[],
  score: ScoreRow | null
): StudentAssessmentRecord {
  const subject = getSingleRelation(module.subject)
  const section = getSingleRelation(module.section)
  const educator = getSingleRelation(module.educator)
  const term = getSingleRelation(module.academic_term)
  const quizTypes = [...new Set(quizRows.map((quiz) => quiz.quiz_type))]
  const questionCount = quizRows.length
  const hasQuestions = questionCount > 0
  const isFinished = Boolean(score?.submitted_at)
  const statusLabel: StudentAssessmentRecord['statusLabel'] = isFinished ? 'finished' : 'pending'

  return {
    id: module.module_id,
    moduleRowId: module.id,
    moduleCode: module.module_code,
    subjectName: subject?.subject_name || 'Unknown Subject',
    sectionName: section?.section_name || 'Unknown Section',
    educatorName: `${educator?.given_name || ''} ${educator?.surname || ''}`.trim() || 'Unknown Educator',
    educatorUserType: 'educator',
    termName: buildAcademicTermLabel(term),
    schedule: formatModuleSchedule(module),
    startDate: module.start_date,
    endDate: module.end_date,
    startTime: module.start_time,
    endTime: module.end_time,
    timeLimitMinutes: Number(module.time_limit) || 0,
    questionCount,
    quizTypeLabel: buildQuizTypeLabel(quizTypes),
    quizTypes,
    isShuffle: module.is_shuffle,
    hasQuestions,
    canTake: hasQuestions && !isFinished,
    isFinished,
    scoreId: score?.id ?? null,
    text: STATIC_ASSESSMENT_TEXT,
    statusLabel,
    read: index === 0,
    labels: [statusLabel],
    attachmentName: 'Study material coming soon',
    attachmentSize: 'Static',
    attachmentLabel: 'Module Study Material',
  }
}

// fetchStudentAssessments - load enrolled module assessments for a student
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

  const { data: moduleData, error: moduleError } = await supabase
    .from('tbl_modules')
    .select(
      'id,module_id,module_code,subject_id,section_id,educator_id,time_limit,is_shuffle,start_date,end_date,start_time,end_time,subject:subject_id(subject_name),section:section_id(section_name),educator:educator_id(given_name,surname,user_type),academic_term:term(term_name,semester)'
    )
    .in('subject_id', subjectIds)
    .in('section_id', sectionIds)
    .in('educator_id', educatorIds)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (moduleError) {
    throw new Error(getSupabaseErrorMessage(moduleError, 'Failed to load student assessments.'))
  }

  const enrolledModules = ((moduleData || []) as ModuleRow[]).filter((module) =>
    enrollmentKeys.has(`${module.subject_id}:${module.section_id}:${module.educator_id}`) &&
    isEducatorUser(getSingleRelation(module.educator))
  )

  if (enrolledModules.length === 0) {
    return [] as StudentAssessmentRecord[]
  }

  const moduleIds = enrolledModules.map((module) => module.id)
  const [{ data: quizData, error: quizError }, { data: scoreData, error: scoreError }] =
    await Promise.all([
      supabase
        .from('tbl_quizzes')
        .select('id,module_id,quiz_type')
        .in('module_id', moduleIds),
      supabase
        .from('tbl_scores')
        .select('id,module_id,submitted_at')
        .eq('student_id', studentId)
        .in('module_id', moduleIds)
        .order('id', { ascending: false }),
    ])

  if (quizError) {
    throw new Error(getSupabaseErrorMessage(quizError, 'Failed to load assessment questions.'))
  }

  if (scoreError) {
    throw new Error(getSupabaseErrorMessage(scoreError, 'Failed to load assessment progress.'))
  }

  const quizMap = ((quizData || []) as QuizRow[]).reduce<Map<number, QuizRow[]>>((result, quiz) => {
    const currentRows = result.get(quiz.module_id) || []
    currentRows.push(quiz)
    result.set(quiz.module_id, currentRows)
    return result
  }, new Map<number, QuizRow[]>())
  const scoreMap = ((scoreData || []) as ScoreRow[]).reduce<Map<number, ScoreRow>>((result, score) => {
    if (!result.has(score.module_id)) {
      result.set(score.module_id, score)
    }

    return result
  }, new Map<number, ScoreRow>())
  const sortedModules = [...enrolledModules].sort((leftModule, rightModule) => {
    const leftScore = scoreMap.get(leftModule.id)
    const rightScore = scoreMap.get(rightModule.id)
    const leftFinished = Boolean(leftScore?.submitted_at)
    const rightFinished = Boolean(rightScore?.submitted_at)

    if (leftFinished !== rightFinished) {
      return leftFinished ? 1 : -1
    }

    return rightModule.id - leftModule.id
  })

  return sortedModules.map((module, index) =>
    mapModuleToStudentAssessment(
      module,
      index,
      quizMap.get(module.id) || [],
      scoreMap.get(module.id) || null
    )
  )
}
