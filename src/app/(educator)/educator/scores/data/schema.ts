import { z } from 'zod'

const educatorScoreChoiceSchema = z.object({
  key: z.enum(['A', 'B', 'C', 'D']),
  value: z.string(),
})

const educatorScoreQuestionSchema = z.object({
  id: z.number(),
  question: z.string(),
  quizType: z.enum(['multiple_choice', 'identification']),
  choices: z.array(educatorScoreChoiceSchema),
  correctAnswers: z.array(z.string()),
  studentAnswer: z.string(),
  isCorrect: z.boolean(),
})

const educatorScoreAttemptHistorySchema = z.object({
  scoreId: z.number(),
  attemptNumber: z.number(),
  score: z.number(),
  totalQuestions: z.number(),
  percentage: z.number(),
  status: z.enum(['passed', 'failed']),
  isPassed: z.boolean(),
  submittedAt: z.string().nullable(),
  takenAt: z.string().nullable(),
  isBestScore: z.boolean(),
})

// educatorScoreSchema - validate educator score review rows
export const educatorScoreSchema = z.object({
  scoreId: z.number(),
  studentId: z.number(),
  studentUserId: z.string(),
  studentName: z.string(),
  moduleRowId: z.number(),
  moduleCode: z.string(),
  subjectId: z.number(),
  subjectName: z.string(),
  sectionId: z.number(),
  sectionName: z.string(),
  termName: z.string(),
  score: z.number(),
  totalQuestions: z.number(),
  percentage: z.number(),
  isPassed: z.boolean(),
  status: z.enum(['passed', 'failed']),
  submittedAt: z.string().nullable(),
  takenAt: z.string().nullable(),
  latestScore: z.number(),
  latestTotalQuestions: z.number(),
  latestPercentage: z.number(),
  latestStatus: z.enum(['passed', 'failed']),
  latestSubmittedAt: z.string().nullable(),
  latestTakenAt: z.string().nullable(),
  allowRetake: z.boolean(),
  retakeCount: z.number(),
  grantedRetakeCount: z.number(),
  effectiveRetakeCount: z.number(),
  submittedAttemptCount: z.number(),
  remainingRetakes: z.number(),
  bestScoreId: z.number().nullable(),
  bestScore: z.number().nullable(),
  latestScoreId: z.number().nullable(),
  canRetake: z.boolean(),
  startDate: z.string(),
  endDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  timeLimitMinutes: z.number(),
  isShuffle: z.boolean(),
  allowReview: z.boolean(),
  warningAttempts: z.number(),
  questions: z.array(educatorScoreQuestionSchema),
  attemptHistory: z.array(educatorScoreAttemptHistorySchema),
})

export type EducatorScore = z.infer<typeof educatorScoreSchema>
