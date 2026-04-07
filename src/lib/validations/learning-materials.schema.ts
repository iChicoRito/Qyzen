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

// parseLearningMaterialSelectionKey - convert a checkbox value into ids
export function parseLearningMaterialSelectionKey(selectionKey: string) {
  const [subjectIdValue, sectionIdValue] = selectionKey.split(':')

  return {
    subjectId: Number(subjectIdValue),
    sectionId: Number(sectionIdValue),
  }
}
