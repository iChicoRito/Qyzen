import { z } from "zod"

export const academicYearSchema = z.object({
  academicYear: z.string(),
  status: z.enum(["active", "inactive"]),
})

export type AcademicYear = z.infer<typeof academicYearSchema>
