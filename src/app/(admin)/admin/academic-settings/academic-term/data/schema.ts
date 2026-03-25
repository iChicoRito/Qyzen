import { z } from 'zod'

export const academicTermSchema = z.object({
  academicTermName: z.string(),
  semester: z.enum(['1st Semester', '2nd Semester']),
  academicYear: z.enum(['2024 - 2025', '2025 - 2026']),
  status: z.enum(['active', 'inactive']),
})

export type AcademicTerm = z.infer<typeof academicTermSchema>
