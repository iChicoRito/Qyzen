import { z } from 'zod'

export const enrollmentUploadHeaders = [
  'student_user_id',
  'subject_code',
  'section_name',
  'status',
] as const

// normalizeEnrollmentUploadValue - normalize spreadsheet cell text
export function normalizeEnrollmentUploadValue(value: unknown) {
  return String(value ?? '').trim()
}

// enrollmentUploadRowSchema - validate one enrollment upload row
export const enrollmentUploadRowSchema = z.object({
  student_user_id: z.string().trim().min(1, 'Student user ID is required.'),
  subject_code: z.string().trim().min(1, 'Subject code is required.'),
  section_name: z.string().trim().min(1, 'Section name is required.'),
  status: z.enum(['active', 'inactive'], {
    message: 'Status must be active or inactive.',
  }),
})

// bulkEnrollmentRowSchema - validate one normalized bulk enrollment row
export const bulkEnrollmentRowSchema = z.object({
  studentId: z.number().int().positive('Student is required.'),
  subjectId: z.number().int().positive('Subject is required.'),
  status: z.enum(['active', 'inactive']),
})

// bulkEnrollmentSchema - validate the bulk enrollment request
export const bulkEnrollmentSchema = z.object({
  rows: z.array(bulkEnrollmentRowSchema).min(1, 'Add at least one enrollment row.'),
})

export type EnrollmentUploadHeader = (typeof enrollmentUploadHeaders)[number]
export type EnrollmentUploadRow = z.infer<typeof enrollmentUploadRowSchema>
export type BulkEnrollmentRow = z.infer<typeof bulkEnrollmentRowSchema>
