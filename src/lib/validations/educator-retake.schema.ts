import { z } from 'zod'

// educatorRetakeFormSchema - validate educator retake grant values
export const educatorRetakeFormSchema = z.object({
  retakeCount: z
    .string()
    .min(1, 'Retake count is required.')
    .refine((value) => /^\d+$/.test(value), 'Retake count must be a whole number.'),
})

export type EducatorRetakeFormSchema = z.infer<typeof educatorRetakeFormSchema>
