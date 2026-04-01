import { z } from 'zod'

const choiceValueSchema = z.object({
  key: z.enum(['A', 'B', 'C', 'D']),
  value: z.string(),
})

// quizQuestionSchema - validate a single quiz question row
export const quizQuestionSchema = z.object({
  id: z.number(),
  moduleRowId: z.number(),
  moduleId: z.string(),
  moduleCode: z.string(),
  termName: z.string(),
  subjectId: z.number(),
  subjectName: z.string(),
  sectionId: z.number(),
  sectionName: z.string(),
  question: z.string(),
  quizType: z.enum(['multiple_choice', 'identification']),
  choices: z.array(choiceValueSchema),
  correctAnswer: z.string(),
  correctAnswers: z.array(z.string()),
})

// quizGroupSchema - validate grouped module quiz table rows
export const quizGroupSchema = z.object({
  moduleRowId: z.number(),
  moduleId: z.string(),
  moduleCode: z.string(),
  termName: z.string(),
  subjectId: z.number(),
  subjectName: z.string(),
  sectionId: z.number(),
  sectionName: z.string(),
  totalQuestions: z.number(),
  multipleChoiceCount: z.number(),
  identificationCount: z.number(),
  quizTypeLabel: z.string(),
  questions: z.array(quizQuestionSchema),
})

export type Quiz = z.infer<typeof quizQuestionSchema>
export type QuizGroup = z.infer<typeof quizGroupSchema>
