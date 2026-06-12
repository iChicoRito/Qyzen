import { z } from 'zod'

// educatorScoreExportSchema - validate score export selections
export const educatorScoreExportSchema = z.object({
  subjectId: z.string().min(1, 'Subject is required.'),
  sectionId: z.string().min(1, 'Section is required.'),
  assessmentRowId: z.string().min(1, 'Assessment is required.'),
  termId: z.string().min(1, 'Term is required.'),
})

export type EducatorScoreExportSchema = z.infer<typeof educatorScoreExportSchema>

