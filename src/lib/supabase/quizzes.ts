'use client'

import type { NotificationInsertInput } from '@/types/notification'

import { fetchActiveStudentRecipientIds, insertNotifications } from './notifications'
import { createClient } from './client'

export interface QuizModuleOption {
  id: number
  moduleId: string
  moduleCode: string
  termName: string
  subjectId: number
  subjectName: string
  sectionId: number
  sectionName: string
}

export interface QuizRecord {
  id: number
  moduleRowId: number
  moduleId: string
  moduleCode: string
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
  moduleRowId: number
  moduleId: string
  moduleCode: string
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

interface QuizModuleRow {
  id: number
  module_code: string
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
  module_id: number
  question: string
  quiz_type: 'multiple_choice' | 'identification'
  choices: unknown
  correct_answer: string
  module: {
    id: number
    module_code: string
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
    module_code: string
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
  moduleId: number
  moduleCode: string
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
    return `A new quiz item was added to ${context.moduleCode} for ${context.subjectName}.`
  }

  if (action === 'uploaded') {
    return `${context.questionCount || 0} quiz items were uploaded to ${context.moduleCode} for ${context.subjectName}.`
  }

  if (action === 'updated') {
    return `A quiz item in ${context.moduleCode} for ${context.subjectName} has been updated.`
  }

  if ((context.questionCount || 0) > 1) {
    return `${context.questionCount} quiz items were removed from ${context.moduleCode} for ${context.subjectName}.`
  }

  return `A quiz item in ${context.moduleCode} for ${context.subjectName} has been removed.`
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
        moduleId: context.moduleId,
        subjectId: context.subjectId,
        sectionId: context.sectionId,
        metadata: {
          moduleCode: context.moduleCode,
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
      'id,module_id,module:module_id(id,module_code,subject_id,section_id,subject:subject_id(subject_name),section:section_id(section_name))'
    )
    .eq('educator_id', educatorId)
    .eq('id', quizId)
    .single()

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load quiz notification details.'))
  }

  const row = data as {
    module_id: number
    module:
      | {
          id: number
          module_code: string
          subject_id: number
          section_id: number
          subject: { subject_name: string } | { subject_name: string }[] | null
          section: { section_name: string } | { section_name: string }[] | null
        }
      | Array<{
          id: number
          module_code: string
          subject_id: number
          section_id: number
          subject: { subject_name: string } | { subject_name: string }[] | null
          section: { section_name: string } | { section_name: string }[] | null
        }>
      | null
  }
  const moduleValue = Array.isArray(row.module) ? row.module[0] : row.module
  const subject = Array.isArray(moduleValue?.subject) ? moduleValue?.subject[0] : moduleValue?.subject
  const section = Array.isArray(moduleValue?.section) ? moduleValue?.section[0] : moduleValue?.section

  return {
    moduleId: moduleValue?.id || row.module_id,
    moduleCode: moduleValue?.module_code || 'Unknown Module',
    subjectId: moduleValue?.subject_id || 0,
    subjectName: subject?.subject_name || 'Unknown Subject',
    sectionId: moduleValue?.section_id || 0,
    sectionName: section?.section_name || 'Unknown Section',
    questionCount: 1,
  } satisfies QuizNotificationContext
}

// fetchModuleQuizNotificationContext - load module quiz details before deleting all questions
async function fetchModuleQuizNotificationContext(educatorId: number, moduleRowId: number) {
  const supabase = createClient()
  const [{ data: moduleData, error: moduleError }, { count, error: countError }] = await Promise.all([
    supabase
      .from('tbl_modules')
      .select('id,module_code,subject_id,section_id,subject:subject_id(subject_name),section:section_id(section_name)')
      .eq('educator_id', educatorId)
      .eq('id', moduleRowId)
      .single(),
    supabase
      .from('tbl_quizzes')
      .select('id', { count: 'exact', head: true })
      .eq('educator_id', educatorId)
      .eq('module_id', moduleRowId),
  ])

  if (moduleError) {
    throw new Error(getSupabaseErrorMessage(moduleError, 'Failed to load quiz module details.'))
  }

  if (countError) {
    throw new Error(getSupabaseErrorMessage(countError, 'Failed to count uploaded quiz items.'))
  }

  const row = moduleData as QuizModuleRow
  const subject = Array.isArray(row.subject) ? row.subject[0] : row.subject
  const section = Array.isArray(row.section) ? row.section[0] : row.section

  return {
    moduleId: row.id,
    moduleCode: row.module_code,
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
  const moduleValue = Array.isArray(row.module) ? row.module[0] : row.module
  const academicTerm = Array.isArray(moduleValue?.academic_term)
    ? moduleValue?.academic_term[0]
    : moduleValue?.academic_term
  const subject = Array.isArray(moduleValue?.subject) ? moduleValue?.subject[0] : moduleValue?.subject
  const section = Array.isArray(moduleValue?.section) ? moduleValue?.section[0] : moduleValue?.section

  return {
    id: row.id,
    moduleRowId: moduleValue?.id || row.module_id,
    moduleId: moduleValue?.module_code || 'Unknown Module',
    moduleCode: moduleValue?.module_code || 'Unknown Module',
    termName: academicTerm ? buildAcademicTermLabel(academicTerm) : 'No term',
    subjectId: moduleValue?.subject_id || 0,
    subjectName: subject?.subject_name || 'Unknown Subject',
    sectionId: moduleValue?.section_id || 0,
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

// groupQuizRows - group question rows into one module row
function groupQuizRows(rows: QuizRecord[]) {
  const groupedRows = rows.reduce<Map<number, QuizGroupRecord>>((result, row) => {
    const currentGroup = result.get(row.moduleRowId)

    if (!currentGroup) {
      result.set(row.moduleRowId, {
        moduleRowId: row.moduleRowId,
        moduleId: row.moduleId,
        moduleCode: row.moduleCode,
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
    result.set(row.moduleRowId, {
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

  return Array.from(groupedRows.values()).sort((leftRow, rightRow) => rightRow.moduleRowId - leftRow.moduleRowId)
}

// fetchQuizModuleOptions - load module options for the add quiz form
export async function fetchQuizModuleOptions() {
  const educatorId = await getCurrentEducatorId()
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tbl_modules')
    .select(
      'id,module_code,term,subject_id,section_id,academic_term:term(id,term_name,semester),subject:subject_id(subject_name),section:section_id(section_name)'
    )
    .eq('educator_id', educatorId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load quiz module options.'))
  }

  return ((data || []) as QuizModuleRow[]).map((row) => {
    const academicTerm = Array.isArray(row.academic_term) ? row.academic_term[0] : row.academic_term
    const subject = Array.isArray(row.subject) ? row.subject[0] : row.subject
    const section = Array.isArray(row.section) ? row.section[0] : row.section

    return {
      id: row.id,
      moduleId: row.module_code,
      moduleCode: row.module_code,
      termName: academicTerm ? buildAcademicTermLabel(academicTerm) : 'No term',
      subjectId: row.subject_id,
      subjectName: subject?.subject_name || 'Unknown Subject',
      sectionId: row.section_id,
      sectionName: section?.section_name || 'Unknown Section',
    } satisfies QuizModuleOption
  })
}

// fetchQuizzes - load educator quiz rows
export async function fetchQuizzes() {
  const educatorId = await getCurrentEducatorId()
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tbl_quizzes')
    .select(
      'id,module_id,question,quiz_type,choices,correct_answer,module:module_id(id,module_code,term,subject_id,section_id,academic_term:term(id,term_name,semester),subject:subject_id(subject_name),section:section_id(section_name))'
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
      module_id: input.moduleRowId,
      subject_id: input.subjectId,
      section_id: input.sectionId,
      educator_id: educatorId,
      question: input.question.trim(),
      quiz_type: input.quizType,
      choices: input.quizType === 'multiple_choice' ? input.choices : null,
      correct_answer: input.correctAnswer,
    })
    .select(
      'id,module_id,question,quiz_type,choices,correct_answer,module:module_id(id,module_code,term,subject_id,section_id,academic_term:term(id,term_name,semester),subject:subject_id(subject_name),section:section_id(section_name))'
    )
    .single()

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to create quiz.'))
  }

  const createdQuiz = mapQuizRow(data as QuizRow)

  await notifyStudentsAboutQuizChange(educatorId, 'created', [
    {
      moduleId: createdQuiz.moduleRowId,
      moduleCode: createdQuiz.moduleCode,
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
    module_id: input.moduleRowId,
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
    const currentContext = result.get(input.moduleRowId)

    if (!currentContext) {
      result.set(input.moduleRowId, {
        moduleId: input.moduleRowId,
        moduleCode: input.moduleCode,
        subjectId: input.subjectId,
        subjectName: input.subjectName,
        sectionId: input.sectionId,
        sectionName: input.sectionName,
        questionCount: 1,
      })
      return result
    }

    result.set(input.moduleRowId, {
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
      module_id: input.moduleRowId,
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
      'id,module_id,question,quiz_type,choices,correct_answer,module:module_id(id,module_code,term,subject_id,section_id,academic_term:term(id,term_name,semester),subject:subject_id(subject_name),section:section_id(section_name))'
    )
    .single()

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to update quiz.'))
  }

  const updatedQuiz = mapQuizRow(data as QuizRow)

  await notifyStudentsAboutQuizChange(educatorId, 'updated', [
    {
      moduleId: updatedQuiz.moduleRowId,
      moduleCode: updatedQuiz.moduleCode,
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

// deleteQuizzesByModule - delete all quiz rows in one module
export async function deleteQuizzesByModule(moduleRowId: number) {
  const educatorId = await getCurrentEducatorId()
  const notificationContext = await fetchModuleQuizNotificationContext(educatorId, moduleRowId)
  const supabase = createClient()
  const { error } = await supabase
    .from('tbl_quizzes')
    .delete()
    .eq('educator_id', educatorId)
    .eq('module_id', moduleRowId)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to delete quizzes for this module.'))
  }

  await notifyStudentsAboutQuizChange(educatorId, 'deleted', [notificationContext])
}
