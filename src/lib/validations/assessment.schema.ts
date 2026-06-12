import { z } from 'zod'

export const assessmentCodeOptions = ['Quiz #1', 'Quiz #2', 'Quiz #3', 'Long Quiz', 'Written Exam'] as const

const timeValueSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Enter a valid time.')

// assessmentFormSchema - validate assessment form values
export const assessmentFormSchema = z
  .object({
    assessmentCodeMode: z.enum(['preset', 'manual']),
    assessmentCodePreset: z.string().optional(),
    assessmentCodeManual: z.string().optional(),
    subjectIds: z.array(z.number()).min(1, 'Select at least one subject.'),
    academicTermId: z.number().optional(),
    timeLimit: z.string().min(1, 'Time limit is required.'),
    cheatingAttempts: z
      .string()
      .min(1, 'Cheating attempts is required.')
      .regex(/^\d+$/, 'Cheating attempts must contain numbers only.'),
    isShuffle: z.boolean(),
    allowReview: z.boolean(),
    allowRetake: z.boolean(),
    retakeCount: z.string().optional(),
    allowHint: z.boolean(),
    hintCount: z.string().optional(),
    status: z.enum(['active', 'inactive']),
    startDate: z.date({ message: 'Start date is required.' }),
    endDate: z.date({ message: 'End date is required.' }),
    startTime: timeValueSchema,
    endTime: timeValueSchema,
  })
  .superRefine((values, context) => {
    const assessmentCode =
      values.assessmentCodeMode === 'preset'
        ? values.assessmentCodePreset?.trim()
        : values.assessmentCodeManual?.trim()

    if (!assessmentCode) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Assessment code is required.',
        path: values.assessmentCodeMode === 'preset' ? ['assessmentCodePreset'] : ['assessmentCodeManual'],
      })
    }

    if (!values.academicTermId || values.academicTermId < 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Academic term is required.',
        path: ['academicTermId'],
      })
    }

    if (values.allowHint) {
      const normalizedHintCount = values.hintCount?.trim() || ''

      if (!normalizedHintCount) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Hint count is required when Allow Hint is enabled.',
          path: ['hintCount'],
        })
      } else if (!/^\d+$/.test(normalizedHintCount)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Hint count must contain numbers only.',
          path: ['hintCount'],
        })
      }
    }

    if (values.allowRetake) {
      const normalizedRetakeCount = values.retakeCount?.trim() || ''

      if (!normalizedRetakeCount) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Retake count is required when Allow Retake is enabled.',
          path: ['retakeCount'],
        })
      } else if (!/^\d+$/.test(normalizedRetakeCount)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Retake count must contain numbers only.',
          path: ['retakeCount'],
        })
      }
    }

    if (values.endDate < values.startDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be on or after the start date.',
        path: ['endDate'],
      })
    }

    if (
      values.startDate.toDateString() === values.endDate.toDateString() &&
      values.endTime < values.startTime
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End time must be later than the start time.',
        path: ['endTime'],
      })
    }
  })

export type AssessmentFormSchema = z.infer<typeof assessmentFormSchema>

// getAssessmentCodeValue - resolve the final assessment code value
export function getAssessmentCodeValue(values: AssessmentFormSchema) {
  if (values.assessmentCodeMode === 'preset') {
    return values.assessmentCodePreset?.trim() || ''
  }

  return values.assessmentCodeManual?.trim() || ''
}

