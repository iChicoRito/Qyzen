import { z } from 'zod'

// moduleSchema - validate module table values
export const moduleSchema = z.object({
  id: z.number(),
  moduleId: z.string(),
  moduleCode: z.string(),
  termId: z.number(),
  termName: z.string(),
  subjectId: z.number(),
  subjectName: z.string(),
  sectionId: z.number(),
  sectionName: z.string(),
  timeLimit: z.string(),
  cheatingAttempts: z.number(),
  isShuffle: z.boolean(),
  status: z.enum(['active', 'inactive']),
  startDate: z.string(),
  endDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
})

export type Module = z.infer<typeof moduleSchema>
