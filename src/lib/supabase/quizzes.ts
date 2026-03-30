'use client'

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

interface UserRow {
  id: number
}

interface QuizModuleRow {
  id: number
  module_id: string
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
    module_id: string
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
    module_id: string
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

// getSupabaseErrorMessage - normalize Supabase errors
function getSupabaseErrorMessage(error: SupabaseErrorResponse | null, fallbackMessage: string) {
  return error?.message || fallbackMessage
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
    moduleId: moduleValue?.module_id || 'Unknown Module',
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

// fetchQuizModuleOptions - load module options for the add quiz form
export async function fetchQuizModuleOptions() {
  const educatorId = await getCurrentEducatorId()
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tbl_modules')
    .select(
      'id,module_id,module_code,term,subject_id,section_id,academic_term:term(id,term_name,semester),subject:subject_id(subject_name),section:section_id(section_name)'
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
      moduleId: row.module_id,
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
      'id,module_id,question,quiz_type,choices,correct_answer,module:module_id(id,module_id,module_code,term,subject_id,section_id,academic_term:term(id,term_name,semester),subject:subject_id(subject_name),section:section_id(section_name))'
    )
    .eq('educator_id', educatorId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to load quizzes.'))
  }

  return ((data || []) as QuizRow[]).map(mapQuizRow)
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
      'id,module_id,question,quiz_type,choices,correct_answer,module:module_id(id,module_id,module_code,term,subject_id,section_id,academic_term:term(id,term_name,semester),subject:subject_id(subject_name),section:section_id(section_name))'
    )
    .single()

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to create quiz.'))
  }

  return mapQuizRow(data as QuizRow)
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
      'id,module_id,question,quiz_type,choices,correct_answer,module:module_id(id,module_id,module_code,term,subject_id,section_id,academic_term:term(id,term_name,semester),subject:subject_id(subject_name),section:section_id(section_name))'
    )
    .single()

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to update quiz.'))
  }

  return mapQuizRow(data as QuizRow)
}

// deleteQuiz - delete one quiz row
export async function deleteQuiz(quizId: number) {
  const educatorId = await getCurrentEducatorId()
  const supabase = createClient()
  const { error } = await supabase
    .from('tbl_quizzes')
    .delete()
    .eq('educator_id', educatorId)
    .eq('id', quizId)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to delete quiz.'))
  }
}
