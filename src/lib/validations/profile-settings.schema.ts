import { z } from 'zod'

import type { AppRole } from '@/lib/auth/auth-context'

interface ProfileRestrictionValues {
  givenName: string
  surname: string
}

// profileSettingsSchema - validate self-service profile settings fields
export const profileSettingsSchema = z
  .object({
    givenName: z.string().trim().min(1, 'Given name is required.'),
    surname: z.string().trim().min(1, 'Surname is required.'),
    email: z.string().trim().email('A valid email is required.'),
  })

// createProfileSettingsSchema - build role-aware validation rules
export function createProfileSettingsSchema(
  role: AppRole | null,
  currentValues: ProfileRestrictionValues
) {
  return profileSettingsSchema.superRefine((values, ctx) => {
    if (role === 'student') {
      if (values.givenName !== currentValues.givenName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['givenName'],
          message: 'Students cannot change their given name.',
        })
      }

      if (values.surname !== currentValues.surname) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['surname'],
          message: 'Students cannot change their surname.',
        })
      }
    }
  })
}

export type ProfileSettingsSchema = z.infer<typeof profileSettingsSchema>
export type ProfileSettingsInput = z.input<typeof profileSettingsSchema>
