import { z } from 'zod'

import type { AppRole } from '@/lib/auth/auth-context'

interface ProfileRestrictionValues {
  userId: string
  givenName: string
  surname: string
}

// passwordFieldSchema - validate optional password updates
const passwordFieldSchema = z
  .string()
  .trim()
  .max(128, 'Password must be 128 characters or less.')
  .optional()
  .transform((value) => value || '')

// baseProfileSettingsSchema - validate shared profile settings fields
export const baseProfileSettingsSchema = z
  .object({
    userId: z.string().trim().min(1, 'User ID is required.'),
    givenName: z.string().trim().min(1, 'Given name is required.'),
    surname: z.string().trim().min(1, 'Surname is required.'),
    email: z.string().trim().email('A valid email is required.'),
    password: passwordFieldSchema,
    confirmPassword: passwordFieldSchema,
  })
  .superRefine((values, ctx) => {
    if (values.password && values.password.length < 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['password'],
        message: 'Password must be at least 6 characters.',
      })
    }

    if (values.password && values.password !== values.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Passwords do not match.',
      })
    }
  })

// createProfileSettingsSchema - build role-aware validation rules
export function createProfileSettingsSchema(
  role: AppRole | null,
  currentValues: ProfileRestrictionValues
) {
  return baseProfileSettingsSchema.superRefine((values, ctx) => {
    if (role !== 'admin') {
      if (values.userId !== currentValues.userId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['userId'],
          message: 'Only admins can change the user ID.',
        })
      }

      if (values.givenName !== currentValues.givenName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['givenName'],
          message: 'Only admins can change the given name.',
        })
      }

      if (values.surname !== currentValues.surname) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['surname'],
          message: 'Only admins can change the surname.',
        })
      }
    }
  })
}

export type BaseProfileSettingsSchema = z.infer<typeof baseProfileSettingsSchema>
export type BaseProfileSettingsInput = z.input<typeof baseProfileSettingsSchema>
