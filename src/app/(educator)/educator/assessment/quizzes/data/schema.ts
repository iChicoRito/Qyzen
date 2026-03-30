import { z } from 'zod'

const choiceValueSchema = z.object({
  key: z.enum(['A', 'B', 'C', 'D']),
  value: z.string(),
})

// quizSchema - validate quiz table values
export const quizSchema = z.object({
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

export type Quiz = z.infer<typeof quizSchema>
