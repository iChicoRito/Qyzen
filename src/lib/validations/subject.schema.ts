import { z } from 'zod'

// subjectFormSchema - validate subject form values
export const subjectFormSchema = z.object({
  subjectCode: z.string().min(1, 'Subject code is required'),
  subjectName: z.string().min(1, 'Subject name is required'),
  sectionIds: z.array(z.number()).min(1, 'Select at least one section'),
  status: z.enum(['active', 'inactive']),
})

export type SubjectFormSchema = z.infer<typeof subjectFormSchema>
