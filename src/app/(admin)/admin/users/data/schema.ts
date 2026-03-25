import { z } from "zod"

export const userSchema = z.object({
  id: z.string(),
  givenName: z.string(),
  surname: z.string(),
  email: z.string().email(),
  status: z.string(),
  userType: z.string(),
})

export type User = z.infer<typeof userSchema>
