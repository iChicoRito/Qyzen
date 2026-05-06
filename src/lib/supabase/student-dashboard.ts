import type { StudentAssessmentRecord } from '@/lib/supabase/student-assessments'
import type { StudentLearningMaterialGroupRecord } from '@/lib/supabase/learning-materials'
import {
  type StudentDashboardAnalytics,
  type StudentNextAssessment,
  type StudentRecentResult,
  type StudentPerformanceTrendPoint,
  type StudentSummaryCard,
} from '@/lib/supabase/student-dashboard-types'

// formatAttemptDate - convert an assessment timestamp into a readable label
function formatAttemptDate(value: string | null) {
  if (!value) {
    return 'No submission yet'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

// getAssessmentScorePercentage - convert a best score into a percent
function getAssessmentScorePercentage(assessment: StudentAssessmentRecord) {
  if (!assessment.bestScore || assessment.questionCount <= 0) {
    return 0
  }

  return Math.round((assessment.bestScore / assessment.questionCount) * 100)
}

// getLatestSubmissionAt - resolve the latest submission timestamp for one assessment
function getLatestSubmissionAt(assessment: StudentAssessmentRecord) {
  return [...assessment.attemptHistory]
    .filter((attempt) => Boolean(attempt.submittedAt))
    .sort((leftAttempt, rightAttempt) => {
      const leftTime = new Date(leftAttempt.submittedAt || '').getTime()
      const rightTime = new Date(rightAttempt.submittedAt || '').getTime()

      if (leftTime !== rightTime) {
        return rightTime - leftTime
      }

      return rightAttempt.scoreId - leftAttempt.scoreId
    })[0]?.submittedAt || null
}

// getLatestSubmittedAttempt - resolve the most recent submitted attempt for one assessment
function getLatestSubmittedAttempt(assessment: StudentAssessmentRecord) {
  return [...assessment.attemptHistory]
    .filter((attempt) => Boolean(attempt.submittedAt))
    .sort((leftAttempt, rightAttempt) => {
      const leftTime = new Date(leftAttempt.submittedAt || '').getTime()
      const rightTime = new Date(rightAttempt.submittedAt || '').getTime()

      if (leftTime !== rightTime) {
        return rightTime - leftTime
      }

      return rightAttempt.scoreId - leftAttempt.scoreId
    })[0] || null
}

// formatTrendLabel - shorten timestamps for chart labels
function formatTrendLabel(value: string | null) {
  if (!value) {
    return 'No date'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

// mapNextAssessment - convert the next assessment record into dashboard data
function mapNextAssessment(assessment: StudentAssessmentRecord): StudentNextAssessment {
  return {
    id: assessment.id,
    moduleRowId: assessment.moduleRowId,
    moduleCode: assessment.moduleCode,
    subjectName: assessment.subjectName,
    sectionName: assessment.sectionName,
    educatorName: assessment.educatorName,
    schedule: assessment.schedule,
    quizTypeLabel: assessment.quizTypeLabel,
    questionCount: assessment.questionCount,
    timeLimitMinutes: assessment.timeLimitMinutes,
    availabilityMessage: assessment.availabilityMessage,
    canTake: assessment.canTake,
    isFinished: assessment.isFinished,
    remainingRetakes: assessment.remainingRetakes,
    statusLabel: assessment.statusLabel,
  }
}

// mapRecentResult - convert one assessment into a recent result row
function mapRecentResult(assessment: StudentAssessmentRecord): StudentRecentResult {
  return {
    id: assessment.id,
    moduleRowId: assessment.moduleRowId,
    moduleCode: assessment.moduleCode,
    subjectName: assessment.subjectName,
    sectionName: assessment.sectionName,
    educatorName: assessment.educatorName,
    submittedAt: getLatestSubmissionAt(assessment),
    scorePercentage: getAssessmentScorePercentage(assessment),
    questionCount: assessment.questionCount,
    attemptCount: assessment.attemptHistory.length,
    statusLabel: assessment.statusLabel,
  }
}

// mapPerformanceTrendPoint - convert one assessment into a chart point
function mapPerformanceTrendPoint(assessment: StudentAssessmentRecord): StudentPerformanceTrendPoint {
  const latestAttempt = getLatestSubmittedAttempt(assessment)

  return {
    submittedAt: latestAttempt?.submittedAt || getLatestSubmissionAt(assessment),
    moduleCode: assessment.moduleCode,
    subjectName: assessment.subjectName,
    scorePercentage: latestAttempt?.percentage ?? getAssessmentScorePercentage(assessment),
    label: formatTrendLabel(latestAttempt?.submittedAt || getLatestSubmissionAt(assessment)),
  }
}

// buildStudentDashboardAnalytics - shape the student dashboard data
export function buildStudentDashboardAnalytics(
  assessments: StudentAssessmentRecord[],
  learningMaterials: StudentLearningMaterialGroupRecord[]
): StudentDashboardAnalytics {
  const availableAssessments = assessments.filter((assessment) => assessment.canTake).length
  const completedAssessments = assessments.filter((assessment) => assessment.isFinished).length
  const retakesAvailable = assessments.filter((assessment) => assessment.canRetake).length
  const totalMaterials = learningMaterials.length

  const finishedAssessments = assessments.filter((assessment) => assessment.isFinished)
  const passRate =
    finishedAssessments.length > 0
      ? (finishedAssessments.filter((assessment) =>
          assessment.attemptHistory.some((attempt) => attempt.status === 'passed')
        ).length /
          finishedAssessments.length) *
        100
      : 0
  const averageScore =
    finishedAssessments.length > 0
      ? finishedAssessments.reduce((total, assessment) => total + getAssessmentScorePercentage(assessment), 0) /
        finishedAssessments.length
      : 0
  const remainingRetakes = assessments.reduce((total, assessment) => total + assessment.remainingRetakes, 0)
  const nextAssessment =
    assessments.find((assessment) => assessment.canTake) ||
    assessments.find((assessment) => assessment.availabilityStatus === 'upcoming') ||
    assessments[0] ||
    null

  const recentResults = [...finishedAssessments]
    .sort((leftAssessment, rightAssessment) => {
      const leftTime = new Date(getLatestSubmissionAt(leftAssessment) || '').getTime()
      const rightTime = new Date(getLatestSubmissionAt(rightAssessment) || '').getTime()

      if (leftTime !== rightTime) {
        return rightTime - leftTime
      }

      return rightAssessment.moduleRowId - leftAssessment.moduleRowId
    })
    .slice(0, 3)
    .map(mapRecentResult)

  const performanceTrend = [...finishedAssessments]
    .sort((leftAssessment, rightAssessment) => {
      const leftTime = new Date(getLatestSubmissionAt(leftAssessment) || '').getTime()
      const rightTime = new Date(getLatestSubmissionAt(rightAssessment) || '').getTime()

      if (leftTime !== rightTime) {
        return leftTime - rightTime
      }

      return leftAssessment.moduleRowId - rightAssessment.moduleRowId
    })
    .slice(-6)
    .map(mapPerformanceTrendPoint)

  const summaryCards: StudentSummaryCard[] = [
    {
      key: 'availableAssessments',
      label: 'Available Assessments',
      value: availableAssessments,
      helper: 'Assessments you can start now',
    },
    {
      key: 'completedAssessments',
      label: 'Completed',
      value: completedAssessments,
      helper: 'Finished assessments and submissions',
    },
    {
      key: 'retakesAvailable',
      label: 'Retakes Available',
      value: retakesAvailable,
      helper: 'Assessments with another attempt ready',
    },
    {
      key: 'learningMaterials',
      label: 'Learning Materials',
      value: totalMaterials,
      helper: 'Subject and section groups with files',
    },
  ]

  return {
    summaryCards,
    progress: {
      completedAssessments,
      passRate,
      averageScore,
      remainingRetakes,
    },
    nextAssessment: nextAssessment ? mapNextAssessment(nextAssessment) : null,
    recentResults,
    learningMaterials,
    performanceTrend,
    assessmentCount: assessments.length,
  }
}
