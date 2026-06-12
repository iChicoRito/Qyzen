'use client'

import type { NotificationInsertInput } from '@/types/notification'

import { fetchActiveStudentRecipientIds, insertNotifications } from './notifications'
import { createClient } from './client'

export interface QuizAssessmentOption {
  id: number
  assessmentId: string
  assessmentCode: string
  termName: string
  subjectId: number
  subjectName: string
  sectionId: number
  sectionName: string
}

export interface QuizRecord {
  id: number
  assessmentRowId: number
  assessmentId: string
  assessmentCode: string
  termName: string
  subjectId: number
  subjectName: string
  sectionId: number
  sectionName: string
  question: string
  quizType: 'multiple_choice' | 'identification'
  choices: Array<{
    key: 'A' | 'B' | 'C' | 'D'
    value: string
  }>
  correctAnswer: string
  correctAnswers: string[]
}

export interface QuizGroupRecord {
  assessmentRowId: number
  assessmentId: string
  assessmentCode: string
  termName: string
  subjectId: number
  subjectName: string
  sectionId: number
  sectionName: string
  totalQuestions: number
  multipleChoiceCount: number
  identificationCount: number
  quizTypeLabel: string
  questions: QuizRecord[]
}

interface UserRow {
  id: number
}

interface QuizAssessmentRow {
  id: number
  assessment_code: string
  term: number
  subject_id: number
  section_id: number
  academic_term:
    | { id: number; term_name: string; semester: string }
    | { id: number; term_name: string; semester: string }[]
    | null
  subject: { subject_name: string } | { subject_name: string }[] | null
  section: { section_name: string } | { section_name: string }[] | null
}

interface QuizRow {
  id: number
  assessment_id: number
  question: string
  quiz_type: 'multiple_choice' | 'identification'
  choices: unknown
  correct_answer: string
  assessment: {
    id: number
    assessment_code: string
    term: number
    subject_id: number
    section_id: number
    academic_term:
      | { id: number; term_name: string; semester: string }
      | { id: number; term_name: string; semester: string }[]
      | null
    subject: { subject_name: string } | { subject_name: string }[] | null
    section: { section_name: string } | { section_name: string }[] | null
  } | Array<{
    id: number
    assessment_code: string
    term: number
    subject_id: number
    section_id: number
    academic_term:
      | { id: number; term_name: string; semester: string }
      | { id: number; term_name: string; semester: string }[]
      | null
    subject: { subject_name: string } | { subject_name: string }[] | null
    section: { section_name: string } | { section_name: string }[] | null
  }> | null
}

interface SupabaseErrorResponse {
  message?: string
}

interface QuizNotificationContext {
  assessmentId: number
  assessmentCode: string
  subjectId: number
  subjectName: string
  sectionId: number
  sectionName: string
  questionCount?: number
}

// getSupabaseErrorMessage - normalize Supabase errors
function getSupabaseErrorMessage(error: SupabaseErrorResponse | null, fallbackMessage: string) {
  return error?.message || fallbackMessage
}

// getQuizNotificationEventType - map quiz actions into notification events
function getQuizNotificationEventType(action: 'created' | 'uploaded' | 'updated' | 'deleted') {
  if (action === 'created') {
    return 'quiz_created' as const
  }

  if (action === 'uploaded') {
    return 'quiz_uploaded' as const
  }

  if (action === 'updated') {
    return 'quiz_updated' as const
  }

  return 'quiz_deleted' as const
}

// buildQuizNotificationTitle - create a short quiz notification title
function buildQuizNotificationTitle(action: 'created' | 'uploaded' | 'updated' | 'deleted') {
  if (action === 'created') {
    return 'New quiz item added'
  }

  if (action === 'uploaded') {
    return 'Quiz uploaded'
  }

  if (action === 'updated') {
    return 'Quiz updated'
  }

  return 'Quiz removed'
}

// buildQuizNotificationMessage - create the quiz notification message body
function buildQuizNotificationMessage(
  action: 'created' | 'uploaded' | 'updated' | 'deleted',
  context: QuizNotificationContext
) {
  if (action === 'created') {
    return `A new quiz item was added to ${context.assessmentCode} for ${context.subjectName}.`
  }

  if (action === 'uploaded') {
    return `${context.questionCount || 0} quiz items were uploaded to ${context.assessmentCode} for ${context.subjectName}.`
  }

  if (action === 'updated') {
    return `A quiz item in ${context.assessmentCode} for ${context.subjectName} has been updated.`
  }

  if ((context.questionCount || 0) > 1) {
    return `${context.questionCount} quiz items were removed from ${context.assessmentCode} for ${context.subjectName}.`
  }

  return `A quiz item in ${context.assessmentCode} for ${context.subjectName} has been removed.`
}

// createQuizNotificationInputs - build notification rows for active enrolled students
async function createQuizNotificationInputs(
  educatorId: number,
  action: 'created' | 'uploaded' | 'updated' | 'deleted',
  contexts: QuizNotificationContext[]
) {
  const notificationRows: NotificationInsertInput[] = []

  for (const context of contexts) {
    const recipientUserIds = await fetchActiveStudentRecipientIds(educatorId, context.subjectId)

    recipientUserIds.forEach((recipientUserId) => {
      notificationRows.push({
        recipientUserId,
        actorUserId: educatorId,
        eventType: getQuizNotificationEventType(action),
        title: buildQuizNotificationTitle(action),
        message: buildQuizNotificationMessage(action, context),
        linkPath: '/student/assessment/quiz',
        assessmentId: context.assessmentId,
        subjectId: context.subjectId,
        sectionId: context.sectionId,
        metadata: {
          assessmentCode: context.assessmentCode,
          subjectName: context.subjectName,
          sectionName: context.sectionName,
          questionCount: context.questionCount,
        },
      })
    })
  }

  return notificationRows
}

// notifyStudentsAboutQuizChange - save best-effort quiz notifications
async function notifyStudentsAboutQuizChange(
  educatorId: number,
  action: 'created' | 'uploaded' | 'updated' | 'deleted',
  contexts: QuizNotificationContext[]
) {
  try {
    const notificationRows = await createQuizNotificationInputs(educatorId, action, contexts)
    await insertNotifications(notificationRows)
  } catch (error) {
    console.error('Failed to save quiz notifications.', error)
  }
}

// fetchQuizNotificationContext - load one quiz context before a delete action
async function fetchQuizNotificationContext(educatorId: number, quizId: number) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tbl_quizzes')
    .select(
      'id,assessment_id,assessment:assessment_id(id,assessment_code,subject_id,section_id,subject:subject_id(subject_name),section:section_id(section_name))'
    )
    .eq('educator_id', educatorId)
    .eq('id', quizId)
    .single()

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load quiz notification details.'))
  }

  const row = data as {
    assessment_id: number
    assessment:
      | {
          id: number
          assessment_code: string
          subject_id: number
          section_id: number
          subject: { subject_name: string } | { subject_name: string }[] | null
          section: { section_name: string } | { section_name: string }[] | null
        }
      | Array<{
          id: number
          assessment_code: string
          subject_id: number
          section_id: number
          subject: { subject_name: string } | { subject_name: string }[] | null
          section: { section_name: string } | { section_name: string }[] | null
        }>
      | null
  }
  const assessmentValue = Array.isArray(row.assessment) ? row.assessment[0] : row.assessment
  const subject = Array.isArray(assessmentValue?.subject) ? assessmentValue?.subject[0] : assessmentValue?.subject
  const section = Array.isArray(assessmentValue?.section) ? assessmentValue?.section[0] : assessmentValue?.section

  return {
    assessmentId: assessmentValue?.id || row.assessment_id,
    assessmentCode: assessmentValue?.assessment_code || 'Unknown Assessment',
    subjectId: assessmentValue?.subject_id || 0,
    subjectName: subject?.subject_name || 'Unknown Subject',
    sectionId: assessmentValue?.section_id || 0,
    sectionName: section?.section_name || 'Unknown Section',
    questionCount: 1,
  } satisfies QuizNotificationContext
}

// fetchAssessmentQuizNotificationContext - load assessment quiz details before deleting all questions
async function fetchAssessmentQuizNotificationContext(educatorId: number, assessmentRowId: number) {
  const supabase = createClient()
  const [{ data: assessmentData, error: assessmentError }, { count, error: countError }] = await Promise.all([
    supabase
      .from('tbl_assessments')
      .select('id,assessment_code,subject_id,section_id,subject:subject_id(subject_name),section:section_id(section_name)')
      .eq('educator_id', educatorId)
      .eq('id', assessmentRowId)
      .single(),
    supabase
      .from('tbl_quizzes')
      .select('id', { count: 'exact', head: true })
      .eq('educator_id', educatorId)
      .eq('assessment_id', assessmentRowId),
  ])

  if (assessmentError) {
    throw new Error(getSupabaseErrorMessage(assessmentError, 'Failed to load quiz assessment details.'))
  }

  if (countError) {
    throw new Error(getSupabaseErrorMessage(countError, 'Failed to count uploaded quiz items.'))
  }

  const row = assessmentData as QuizAssessmentRow
  const subject = Array.isArray(row.subject) ? row.subject[0] : row.subject
  const section = Array.isArray(row.section) ? row.section[0] : row.section

  return {
    assessmentId: row.id,
    assessmentCode: row.assessment_code,
    subjectId: row.subject_id,
    subjectName: subject?.subject_name || 'Unknown Subject',
    sectionId: row.section_id,
    sectionName: section?.section_name || 'Unknown Section',
    questionCount: count || 0,
  } satisfies QuizNotificationContext
}

// getCurrentEducatorId - resolve current educator profile id
async function getCurrentEducatorId() {
  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user?.email) {
    throw new Error('Authenticated educator was not found.')
  }

  const { data, error } = await supabase
    .from('tbl_users')
    .select('id')
    .eq('email', user.email)
    .is('deleted_at', null)
    .limit(1)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load educator profile.'))
  }

  const rows = (data || []) as UserRow[]

  if (!rows[0]) {
    throw new Error('Educator profile was not found.')
  }

  return rows[0].id
}

// normalizeChoices - convert stored choices into quiz choice rows
function normalizeChoices(choices: unknown): QuizRecord['choices'] {
  if (!Array.isArray(choices)) {
    return []
  }

  return choices
    .map((choice) => {
      if (
        typeof choice === 'object' &&
        choice !== null &&
        'key' in choice &&
        'value' in choice &&
        (choice.key === 'A' || choice.key === 'B' || choice.key === 'C' || choice.key === 'D') &&
        typeof choice.value === 'string'
      ) {
        return {
          key: choice.key,
          value: choice.value,
        }
      }

      return null
    })
    .filter(
      (
        choice
      ): choice is {
        key: 'A' | 'B' | 'C' | 'D'
        value: string
      } => Boolean(choice)
    )
}

// normalizeCorrectAnswers - convert stored correct answer text into quiz answers
function normalizeCorrectAnswers(quizType: 'multiple_choice' | 'identification', correctAnswer: string) {
  if (quizType === 'multiple_choice') {
    return correctAnswer ? [correctAnswer] : []
  }

  try {
    const parsedValue = JSON.parse(correctAnswer) as unknown

    if (!Array.isArray(parsedValue)) {
      return correctAnswer ? [correctAnswer] : []
    }

    return parsedValue.filter((value): value is string => typeof value === 'string')
  } catch {
    return correctAnswer ? [correctAnswer] : []
  }
}

// buildAcademicTermLabel - format academic term label
function buildAcademicTermLabel(term: { term_name: string; semester: string }) {
  return `${term.term_name} - ${term.semester}`
}

// mapQuizRow - convert supabase quiz row into app shape
function mapQuizRow(row: QuizRow): QuizRecord {
  const assessmentValue = Array.isArray(row.assessment) ? row.assessment[0] : row.assessment
  const academicTerm = Array.isArray(assessmentValue?.academic_term)
    ? assessmentValue?.academic_term[0]
    : assessmentValue?.academic_term
  const subject = Array.isArray(assessmentValue?.subject) ? assessmentValue?.subject[0] : assessmentValue?.subject
  const section = Array.isArray(assessmentValue?.section) ? assessmentValue?.section[0] : assessmentValue?.section

  return {
    id: row.id,
    assessmentRowId: assessmentValue?.id || row.assessment_id,
    assessmentId: assessmentValue?.assessment_code || 'Unknown Assessment',
    assessmentCode: assessmentValue?.assessment_code || 'Unknown Assessment',
    termName: academicTerm ? buildAcademicTermLabel(academicTerm) : 'No term',
    subjectId: assessmentValue?.subject_id || 0,
    subjectName: subject?.subject_name || 'Unknown Subject',
    sectionId: assessmentValue?.section_id || 0,
    sectionName: section?.section_name || 'Unknown Section',
    question: row.question,
    quizType: row.quiz_type,
    choices: normalizeChoices(row.choices),
    correctAnswer: row.correct_answer,
    correctAnswers: normalizeCorrectAnswers(row.quiz_type, row.correct_answer),
  }
}

// buildQuizTypeLabel - summarize grouped quiz types
function buildQuizTypeLabel(questions: QuizRecord[]) {
  const hasMultipleChoice = questions.some((question) => question.quizType === 'multiple_choice')
  const hasIdentification = questions.some((question) => question.quizType === 'identification')

  if (hasMultipleChoice && hasIdentification) {
    return 'Mixed'
  }

  if (hasMultipleChoice) {
    return 'Multiple Choice'
  }

  if (hasIdentification) {
    return 'Identification'
  }

  return 'No Questions'
}

// groupQuizRows - group question rows into one assessment row
function groupQuizRows(rows: QuizRecord[]) {
  const groupedRows = rows.reduce<Map<number, QuizGroupRecord>>((result, row) => {
    const currentGroup = result.get(row.assessmentRowId)

    if (!currentGroup) {
      result.set(row.assessmentRowId, {
        assessmentRowId: row.assessmentRowId,
        assessmentId: row.assessmentId,
        assessmentCode: row.assessmentCode,
        termName: row.termName,
        subjectId: row.subjectId,
        subjectName: row.subjectName,
        sectionId: row.sectionId,
        sectionName: row.sectionName,
        totalQuestions: 1,
        multipleChoiceCount: row.quizType === 'multiple_choice' ? 1 : 0,
        identificationCount: row.quizType === 'identification' ? 1 : 0,
        quizTypeLabel: buildQuizTypeLabel([row]),
        questions: [row],
      })
      return result
    }

    const nextQuestions = [...currentGroup.questions, row]
    result.set(row.assessmentRowId, {
      ...currentGroup,
      totalQuestions: nextQuestions.length,
      multipleChoiceCount:
        currentGroup.multipleChoiceCount + (row.quizType === 'multiple_choice' ? 1 : 0),
      identificationCount:
        currentGroup.identificationCount + (row.quizType === 'identification' ? 1 : 0),
      quizTypeLabel: buildQuizTypeLabel(nextQuestions),
      questions: nextQuestions,
    })

    return result
  }, new Map<number, QuizGroupRecord>())

  return Array.from(groupedRows.values()).sort((leftRow, rightRow) => rightRow.assessmentRowId - leftRow.assessmentRowId)
}

// fetchQuizAssessmentOptions - load assessment options for the add quiz form
export async function fetchQuizAssessmentOptions() {
  const educatorId = await getCurrentEducatorId()
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tbl_assessments')
    .select(
      'id,assessment_code,term,subject_id,section_id,academic_term:term(id,term_name,semester),subject:subject_id(subject_name),section:section_id(section_name)'
    )
    .eq('educator_id', educatorId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load quiz assessment options.'))
  }

  return ((data || []) as QuizAssessmentRow[]).map((row) => {
    const academicTerm = Array.isArray(row.academic_term) ? row.academic_term[0] : row.academic_term
    const subject = Array.isArray(row.subject) ? row.subject[0] : row.subject
    const section = Array.isArray(row.section) ? row.section[0] : row.section

    return {
      id: row.id,
      assessmentId: row.assessment_code,
      assessmentCode: row.assessment_code,
      termName: academicTerm ? buildAcademicTermLabel(academicTerm) : 'No term',
      subjectId: row.subject_id,
      subjectName: subject?.subject_name || 'Unknown Subject',
      sectionId: row.section_id,
      sectionName: section?.section_name || 'Unknown Section',
    } satisfies QuizAssessmentOption
  })
}

// fetchQuizzes - load educator quiz rows
export async function fetchQuizzes() {
  const educatorId = await getCurrentEducatorId()
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tbl_quizzes')
    .select(
      'id,assessment_id,question,quiz_type,choices,correct_answer,assessment:assessment_id(id,assessment_code,term,subject_id,section_id,academic_term:term(id,term_name,semester),subject:subject_id(subject_name),section:section_id(section_name))'
    )
    .eq('educator_id', educatorId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load quizzes.'))
  }

  return groupQuizRows(((data || []) as QuizRow[]).map(mapQuizRow))
}

// createQuiz - insert one quiz row
export async function createQuiz(input: QuizRecord) {
  const educatorId = await getCurrentEducatorId()
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tbl_quizzes')
    .insert({
      assessment_id: input.assessmentRowId,
      subject_id: input.subjectId,
      section_id: input.sectionId,
      educator_id: educatorId,
      question: input.question.trim(),
      quiz_type: input.quizType,
      choices: input.quizType === 'multiple_choice' ? input.choices : null,
      correct_answer: input.correctAnswer,
    })
    .select(
      'id,assessment_id,question,quiz_type,choices,correct_answer,assessment:assessment_id(id,assessment_code,term,subject_id,section_id,academic_term:term(id,term_name,semester),subject:subject_id(subject_name),section:section_id(section_name))'
    )
    .single()

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to create quiz.'))
  }

  const createdQuiz = mapQuizRow(data as QuizRow)

  await notifyStudentsAboutQuizChange(educatorId, 'created', [
    {
      assessmentId: createdQuiz.assessmentRowId,
      assessmentCode: createdQuiz.assessmentCode,
      subjectId: createdQuiz.subjectId,
      subjectName: createdQuiz.subjectName,
      sectionId: createdQuiz.sectionId,
      sectionName: createdQuiz.sectionName,
      questionCount: 1,
    },
  ])

  return createdQuiz
}

// createQuizzes - insert many quiz rows
export async function createQuizzes(inputs: QuizRecord[]) {
  if (inputs.length === 0) {
    return
  }

  const educatorId = await getCurrentEducatorId()
  const supabase = createClient()
  const rowsToInsert = inputs.map((input) => ({
    assessment_id: input.assessmentRowId,
    subject_id: input.subjectId,
    section_id: input.sectionId,
    educator_id: educatorId,
    question: input.question.trim(),
    quiz_type: input.quizType,
    choices: input.quizType === 'multiple_choice' ? input.choices : null,
    correct_answer: input.correctAnswer,
  }))
  const { error } = await supabase.from('tbl_quizzes').insert(rowsToInsert)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to upload quizzes.'))
  }

  const uploadContextMap = inputs.reduce<Map<number, QuizNotificationContext>>((result, input) => {
    const currentContext = result.get(input.assessmentRowId)

    if (!currentContext) {
      result.set(input.assessmentRowId, {
        assessmentId: input.assessmentRowId,
        assessmentCode: input.assessmentCode,
        subjectId: input.subjectId,
        subjectName: input.subjectName,
        sectionId: input.sectionId,
        sectionName: input.sectionName,
        questionCount: 1,
      })
      return result
    }

    result.set(input.assessmentRowId, {
      ...currentContext,
      questionCount: (currentContext.questionCount || 0) + 1,
    })

    return result
  }, new Map())

  await notifyStudentsAboutQuizChange(educatorId, 'uploaded', Array.from(uploadContextMap.values()))
}

// updateQuiz - update one quiz row
export async function updateQuiz(input: QuizRecord) {
  const educatorId = await getCurrentEducatorId()
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tbl_quizzes')
    .update({
      assessment_id: input.assessmentRowId,
      subject_id: input.subjectId,
      section_id: input.sectionId,
      question: input.question.trim(),
      quiz_type: input.quizType,
      choices: input.quizType === 'multiple_choice' ? input.choices : null,
      correct_answer: input.correctAnswer,
    })
    .eq('educator_id', educatorId)
    .eq('id', input.id)
    .select(
      'id,assessment_id,question,quiz_type,choices,correct_answer,assessment:assessment_id(id,assessment_code,term,subject_id,section_id,academic_term:term(id,term_name,semester),subject:subject_id(subject_name),section:section_id(section_name))'
    )
    .single()

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to update quiz.'))
  }

  const updatedQuiz = mapQuizRow(data as QuizRow)

  await notifyStudentsAboutQuizChange(educatorId, 'updated', [
    {
      assessmentId: updatedQuiz.assessmentRowId,
      assessmentCode: updatedQuiz.assessmentCode,
      subjectId: updatedQuiz.subjectId,
      subjectName: updatedQuiz.subjectName,
      sectionId: updatedQuiz.sectionId,
      sectionName: updatedQuiz.sectionName,
      questionCount: 1,
    },
  ])

  return updatedQuiz
}

// deleteQuiz - delete one quiz row
export async function deleteQuiz(quizId: number) {
  const educatorId = await getCurrentEducatorId()
  const notificationContext = await fetchQuizNotificationContext(educatorId, quizId)
  const supabase = createClient()
  const { error } = await supabase
    .from('tbl_quizzes')
    .delete()
    .eq('educator_id', educatorId)
    .eq('id', quizId)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to delete quiz.'))
  }

  await notifyStudentsAboutQuizChange(educatorId, 'deleted', [notificationContext])
}

// deleteQuizzesByAssessment - delete all quiz rows in one assessment
export async function deleteQuizzesByAssessment(assessmentRowId: number) {
  const educatorId = await getCurrentEducatorId()
  const notificationContext = await fetchAssessmentQuizNotificationContext(educatorId, assessmentRowId)
  const supabase = createClient()
  const { error } = await supabase
    .from('tbl_quizzes')
    .delete()
    .eq('educator_id', educatorId)
    .eq('assessment_id', assessmentRowId)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to delete quizzes for this assessment.'))
  }

  await notifyStudentsAboutQuizChange(educatorId, 'deleted', [notificationContext])
}

