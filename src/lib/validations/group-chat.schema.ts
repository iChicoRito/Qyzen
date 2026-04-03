import { z } from 'zod'

// createGroupChatFormSchema - validate educator manual group chat creation
export const createGroupChatFormSchema = z.object({
  subjectId: z.number().min(1, 'Select a subject and section.'),
})

export type CreateGroupChatFormSchema = z.infer<typeof createGroupChatFormSchema>
