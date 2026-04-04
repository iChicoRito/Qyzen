import { z } from 'zod'

// forgotPasswordEmailSchema - validate the email request step
export const forgotPasswordEmailSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
})

// forgotPasswordOtpSchema - validate the 6 digit code step
export const forgotPasswordOtpSchema = z.object({
  code: z
    .string()
    .length(6, 'Enter the 6-digit code sent to your email.')
    .refine((value) => value.replace(/\s/g, '').length === 6, {
      message: 'Enter the 6-digit code sent to your email.',
    }),
})

// forgotPasswordResetSchema - validate the new password step
export const forgotPasswordResetSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

// forgotPasswordFlowSchema - validate the full recovery payload
export const forgotPasswordFlowSchema = z
  .object({
    email: z.string().trim().email('Invalid email address'),
    code: z
      .string()
      .length(6, 'Enter the 6-digit code sent to your email.')
      .refine((value) => value.replace(/\s/g, '').length === 6, {
        message: 'Enter the 6-digit code sent to your email.',
      }),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

export type ForgotPasswordEmailSchema = z.infer<typeof forgotPasswordEmailSchema>
export type ForgotPasswordOtpSchema = z.infer<typeof forgotPasswordOtpSchema>
export type ForgotPasswordResetSchema = z.infer<typeof forgotPasswordResetSchema>
export type ForgotPasswordFlowSchema = z.infer<typeof forgotPasswordFlowSchema>
