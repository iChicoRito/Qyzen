import { z } from 'zod'

export const userSchema = z.object({
  id: z.number(),
  userId: z.string(),
  givenName: z.string(),
  surname: z.string(),
  email: z.string().email(),
  profilePicture: z.string().nullable(),
  coverPhoto: z.string().nullable(),
  status: z.enum(['active', 'inactive']),
  userType: z.enum(['admin', 'student', 'educator']),
  roleNames: z.array(z.string()),
})

export type User = z.infer<typeof userSchema>
