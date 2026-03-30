import { z } from 'zod'

// studentQuizAttemptSchema - validate quiz save and submit payloads
export const studentQuizAttemptSchema = z.object({
  mode: z.enum(['draft', 'submit']),
  answers: z.record(z.string(), z.string().default('')),
  warningAttempts: z.number().int().min(0).default(0),
})

export type StudentQuizAttemptSchema = z.infer<typeof studentQuizAttemptSchema>

// studentQuizFormSchema - validate student answer form values
export const studentQuizFormSchema = z.object({
  answers: z.record(z.string(), z.string().default('')),
})

export type StudentQuizFormSchema = z.infer<typeof studentQuizFormSchema>
