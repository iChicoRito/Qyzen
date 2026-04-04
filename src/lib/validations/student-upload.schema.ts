import { z } from 'zod'

export const studentUploadHeaders = [
  'user_id',
  'given_name',
  'surname',
  'email',
  'role_names',
] as const

const studentIdPattern = /^\d{4}-\d{5}$/

// normalizeSpreadsheetValue - normalize spreadsheet cell text
export function normalizeSpreadsheetValue(value: unknown) {
  return String(value ?? '').trim()
}

// parseRoleNames - split uploaded role names into clean values
export function parseRoleNames(value: string) {
  return value
    .split('|')
    .map((roleName) => roleName.trim())
    .filter(Boolean)
}

// studentUploadRowSchema - validate one spreadsheet row
export const studentUploadRowSchema = z.object({
  user_id: z
    .string()
    .trim()
    .min(1, 'User ID is required.')
    .regex(studentIdPattern, 'Student ID must use the format 1234-12345.'),
  given_name: z.string().trim().min(1, 'Given name is required.'),
  surname: z.string().trim().min(1, 'Surname is required.'),
  email: z.string().trim().min(1, 'Email is required.').email('A valid email is required.'),
  role_names: z.string().trim().min(1, 'Select at least one role.'),
})

// bulkStudentCreateItemSchema - validate one normalized upload item
export const bulkStudentCreateItemSchema = z.object({
  userId: z
    .string()
    .trim()
    .min(1, 'User ID is required.')
    .regex(studentIdPattern, 'Student ID must use the format 1234-12345.'),
  givenName: z.string().trim().min(1, 'Given name is required.'),
  surname: z.string().trim().min(1, 'Surname is required.'),
  email: z.string().trim().min(1, 'Email is required.').email('A valid email is required.'),
  roleNames: z.array(z.string().trim().min(1)).min(1, 'Select at least one role.'),
})

// bulkStudentCreateSchema - validate the bulk create request payload
export const bulkStudentCreateSchema = z.object({
  students: z.array(bulkStudentCreateItemSchema).min(1, 'Add at least one student.'),
})

export type StudentUploadHeader = (typeof studentUploadHeaders)[number]
export type StudentUploadRow = z.infer<typeof studentUploadRowSchema>
export type BulkStudentCreateItem = z.infer<typeof bulkStudentCreateItemSchema>
export type BulkStudentCreateSchema = z.infer<typeof bulkStudentCreateSchema>
