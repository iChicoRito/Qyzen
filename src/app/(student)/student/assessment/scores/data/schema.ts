import { z } from 'zod'

const scoreChoiceSchema = z.object({
  key: z.enum(['A', 'B', 'C', 'D']),
  value: z.string(),
})

const scoreQuestionSchema = z.object({
  id: z.number(),
  question: z.string(),
  quizType: z.enum(['multiple_choice', 'identification']),
  choices: z.array(scoreChoiceSchema),
  correctAnswers: z.array(z.string()),
  studentAnswer: z.string(),
  isCorrect: z.boolean(),
})

// scoreSchema - validate student score review rows
export const scoreSchema = z.object({
  scoreId: z.number(),
  moduleRowId: z.number(),
  moduleCode: z.string(),
  subjectName: z.string(),
  sectionName: z.string(),
  educatorName: z.string(),
  termName: z.string(),
  score: z.number(),
  totalQuestions: z.number(),
  percentage: z.number(),
  isPassed: z.boolean(),
  status: z.enum(['passed', 'failed']),
  submittedAt: z.string().nullable(),
  takenAt: z.string().nullable(),
  startDate: z.string(),
  endDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  timeLimitMinutes: z.number(),
  isShuffle: z.boolean(),
  allowReview: z.boolean(),
  warningAttempts: z.number(),
  questions: z.array(scoreQuestionSchema),
})

export type Score = z.infer<typeof scoreSchema>
