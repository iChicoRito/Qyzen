import { z } from 'zod'

export const permissionSchema = z.object({
  permissionName: z.string(),
  description: z.string(),
  resource: z.string(),
  action: z.string(),
  module: z.string(),
  permissionString: z.string(),
  status: z.enum(['active', 'inactive']),
})

export type Permission = z.infer<typeof permissionSchema>
