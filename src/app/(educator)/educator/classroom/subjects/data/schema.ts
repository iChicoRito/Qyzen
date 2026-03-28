import { z } from 'zod'

// subjectSectionSchema - validate subject section values
export const subjectSectionSchema = z.object({
  id: z.number(),
  name: z.string(),
  status: z.enum(['active', 'inactive']),
})

// subjectSchema - validate subject table values
export const subjectSchema = z.object({
  id: z.number(),
  rowIds: z.array(z.number()),
  subjectCode: z.string(),
  subjectName: z.string(),
  status: z.enum(['active', 'inactive']),
  sections: z.array(subjectSectionSchema),
})

export type Subject = z.infer<typeof subjectSchema>
export type SubjectSection = z.infer<typeof subjectSectionSchema>
