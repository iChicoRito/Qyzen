import { z } from 'zod'

// resetPasswordSchema - validate the new password form
export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>
