import { z } from 'zod'

// educatorManagedGroupChatSchema - validate educator group chat management rows
export const educatorManagedGroupChatSchema = z.object({
  id: z.number(),
  subjectId: z.number(),
  sectionId: z.number(),
  educatorId: z.number(),
  subjectName: z.string(),
  sectionName: z.string(),
  studentCount: z.number(),
  onlineStudentCount: z.number(),
  createdAt: z.string(),
})

export type EducatorManagedGroupChatRow = z.infer<typeof educatorManagedGroupChatSchema>
