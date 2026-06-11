import { z } from 'zod'

export const allowedLearningMaterialExtensions = [
  'pptx',
  'ppsx',
  'ppt',
  'pdf',
  'docx',
  'doc',
  'rtf',
] as const

export const MAX_LEARNING_MATERIAL_FILE_SIZE_BYTES = 20 * 1024 * 1024

export const learningMaterialSelectionKeySchema = z
  .string()
  .regex(/^\d+:\d+$/, 'Select a valid subject and section assignment.')

export const uploadLearningMaterialsSchema = z.object({
  selectionKeys: z.array(learningMaterialSelectionKeySchema).min(1, 'Select at least one subject and section.'),
  filesCount: z.number().int().min(1, 'Select at least one file.'),
})

export const updateLearningMaterialSchema = z.object({
  selectionKey: learningMaterialSelectionKeySchema,
  filesCount: z.number().int().min(0),
})

// getLearningMaterialExtension - normalize a file extension for validation
export function getLearningMaterialExtension(fileName: string) {
  return fileName.split('.').pop()?.trim().toLowerCase() || ''
}

// isLearningMaterialExtensionAllowed - validate supported upload extensions
export function isLearningMaterialExtensionAllowed(fileName: string) {
  return allowedLearningMaterialExtensions.includes(
    getLearningMaterialExtension(fileName) as (typeof allowedLearningMaterialExtensions)[number]
  )
}

// validateLearningMaterialFileSize - block oversized learning material uploads
export function validateLearningMaterialFileSize(file: File) {
  if (file.size > MAX_LEARNING_MATERIAL_FILE_SIZE_BYTES) {
    throw new Error(`${file.name} must be 20 MB or less.`)
  }
}

// parseLearningMaterialSelectionKey - convert a checkbox value into ids
export function parseLearningMaterialSelectionKey(selectionKey: string) {
  const [subjectIdValue, sectionIdValue] = selectionKey.split(':')

  return {
    subjectId: Number(subjectIdValue),
    sectionId: Number(sectionIdValue),
  }
}
