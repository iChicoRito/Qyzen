import { z } from 'zod'

// academicTermSchema - validate section academic term values
export const academicTermSchema = z.object({
  id: z.number(),
  name: z.string(),
  semester: z.string(),
  label: z.string(),
})

// sectionSchema - validate section table values
export const sectionSchema = z.object({
  id: z.number(),
  sectionName: z.string(),
  status: z.enum(['active', 'inactive']),
  academicTerms: z.array(academicTermSchema),
})

export type Section = z.infer<typeof sectionSchema>
export type SectionAcademicTerm = z.infer<typeof academicTermSchema>
