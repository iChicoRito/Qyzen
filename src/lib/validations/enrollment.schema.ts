import { z } from 'zod'

// addEnrollmentFormSchema - validate add enrollment values
export const addEnrollmentFormSchema = z.object({
  studentIds: z.array(z.number()).min(1, 'Select at least one student'),
  subjectIds: z.array(z.number()).min(1, 'Select at least one subject'),
  status: z.enum(['active', 'inactive']),
})

// editEnrollmentFormSchema - validate edit enrollment values
export const editEnrollmentFormSchema = z.object({
  studentId: z.number().min(1, 'Select a student'),
  subjectId: z.number().min(1, 'Select a subject'),
  status: z.enum(['active', 'inactive']),
})

export type AddEnrollmentFormSchema = z.infer<typeof addEnrollmentFormSchema>
export type EditEnrollmentFormSchema = z.infer<typeof editEnrollmentFormSchema>
