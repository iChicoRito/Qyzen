import { z } from 'zod'

export const quizTypeOptions = ['multiple_choice', 'identification'] as const

const choiceSchema = z.object({
  key: z.enum(['A', 'B', 'C', 'D']),
  value: z.string().optional(),
})

const identificationAnswerSchema = z.object({
  value: z.string().optional(),
})

// quizFormSchema - validate quiz form values
export const quizFormSchema = z
  .object({
    moduleId: z.string().min(1, 'Module is required.'),
    quizType: z.enum(quizTypeOptions),
    question: z.string().min(1, 'Question is required.'),
    correctChoice: z.enum(['A', 'B', 'C', 'D']).optional(),
    choices: z.array(choiceSchema).length(4),
    identificationAnswers: z.array(identificationAnswerSchema).min(1, 'Add at least one correct answer.'),
  })
  .superRefine((values, context) => {
    if (values.quizType === 'multiple_choice') {
      values.choices.forEach((choice, index) => {
        if (!choice.value?.trim()) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Choice ${choice.key} is required.`,
            path: ['choices', index, 'value'],
          })
        }
      })

      if (!values.correctChoice) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Select the correct answer.',
          path: ['correctChoice'],
        })
      }
    }

    if (values.quizType === 'identification') {
      const normalizedAnswers = values.identificationAnswers
        .map((answer) => answer.value?.trim() || '')
        .filter(Boolean)

      if (normalizedAnswers.length === 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Add at least one correct answer.',
          path: ['identificationAnswers'],
        })
      }

      values.identificationAnswers.forEach((answer, index) => {
        if (!answer.value?.trim()) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Correct answer is required.',
            path: ['identificationAnswers', index, 'value'],
          })
        }
      })
    }
  })

export type QuizFormSchema = z.infer<typeof quizFormSchema>

// buildQuizPayload - normalize quiz form values for table rows and database storage
export function buildQuizPayload(values: QuizFormSchema) {
  const normalizedQuestion = values.question.trim()

  if (values.quizType === 'multiple_choice') {
    const normalizedChoices = values.choices.map((choice) => ({
      key: choice.key,
      value: choice.value?.trim() || '',
    }))
    const selectedChoice = normalizedChoices.find((choice) => choice.key === values.correctChoice)

    return {
      moduleId: Number(values.moduleId),
      quizType: values.quizType,
      question: normalizedQuestion,
      choices: normalizedChoices,
      correctAnswer: selectedChoice?.value || '',
      correctAnswers: [selectedChoice?.value || ''],
    }
  }

  const normalizedAnswers = values.identificationAnswers
    .map((answer) => answer.value.trim())
    .filter(Boolean)

  return {
    moduleId: Number(values.moduleId),
    quizType: values.quizType,
    question: normalizedQuestion,
    choices: [],
    correctAnswer: JSON.stringify(normalizedAnswers),
    correctAnswers: normalizedAnswers,
  }
}
