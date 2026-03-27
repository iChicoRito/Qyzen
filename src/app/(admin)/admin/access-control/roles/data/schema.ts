import { z } from 'zod'

export const roleSchema = z.object({
  roleName: z.string(),
  description: z.string(),
  permissionsCount: z.number(),
  status: z.enum(['active', 'inactive']),
  isSystem: z.boolean(),
})

export type Role = z.infer<typeof roleSchema>
