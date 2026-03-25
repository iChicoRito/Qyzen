import { z } from 'zod'

export const permissionSchema = z.object({
  permissionName: z.string(),
  description: z.string(),
  role: z.string(),
  action: z.string(),
  module: z.string(),
  status: z.enum(['active', 'inactive']),
})

export type Permission = z.infer<typeof permissionSchema>
