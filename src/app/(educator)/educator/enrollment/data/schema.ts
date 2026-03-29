import { z } from 'zod'

// enrollmentStudentSchema - validate enrolled student values
export const enrollmentStudentSchema = z.object({
  id: z.number(),
  userId: z.string(),
  fullName: z.string(),
  status: z.enum(['active', 'inactive']),
})

// enrollmentSectionSchema - validate enrolled section values
export const enrollmentSectionSchema = z.object({
  id: z.number(),
  name: z.string(),
  status: z.enum(['active', 'inactive']),
})

// enrollmentSubjectSchema - validate enrolled subject values
export const enrollmentSubjectSchema = z.object({
  id: z.number(),
  subjectCode: z.string(),
  subjectName: z.string(),
  status: z.enum(['active', 'inactive']),
  section: enrollmentSectionSchema,
})

// enrollmentSchema - validate enrollment table values
export const enrollmentSchema = z.object({
  id: z.number(),
  student: enrollmentStudentSchema,
  educator: enrollmentStudentSchema,
  subject: enrollmentSubjectSchema,
  status: z.enum(['active', 'inactive']),
})

export type Enrollment = z.infer<typeof enrollmentSchema>

// taskSchema - legacy compatibility for unused task modal files
export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string(),
  category: z.string(),
  priority: z.string(),
})

export type Task = z.infer<typeof taskSchema>
