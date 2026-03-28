import { z } from 'zod'

// sectionFormSchema - validate section form values
export const sectionFormSchema = z.object({
  sectionName: z.string().min(1, 'Section name is required'),
  academicTermIds: z.array(z.number()).min(1, 'Select at least one academic term'),
  status: z.enum(['active', 'inactive']),
})

export type SectionFormSchema = z.infer<typeof sectionFormSchema>
