import type { StudentAssessmentRecord } from '@/lib/supabase/student-assessments'
import type { StudentLearningMaterialGroupRecord } from '@/lib/supabase/learning-materials'

export interface StudentSummaryCard {
  key: 'availableAssessments' | 'completedAssessments' | 'retakesAvailable' | 'learningMaterials'
  label: string
  value: number
  helper: string
}

export interface StudentProgressMetrics {
  completedAssessments: number
  passRate: number
  averageScore: number
  remainingRetakes: number
}

export interface StudentNextAssessment {
  id: string
  moduleRowId: number
  moduleCode: string
  subjectName: string
  sectionName: string
  educatorName: string
  schedule: string
  quizTypeLabel: string
  questionCount: number
  timeLimitMinutes: number
  availabilityMessage: string
  canTake: boolean
  isFinished: boolean
  remainingRetakes: number
  statusLabel: StudentAssessmentRecord['statusLabel']
}

export interface StudentRecentResult {
  id: string
  moduleRowId: number
  moduleCode: string
  subjectName: string
  sectionName: string
  educatorName: string
  submittedAt: string | null
  scorePercentage: number
  questionCount: number
  attemptCount: number
  statusLabel: StudentAssessmentRecord['statusLabel']
}

export interface StudentPerformanceTrendPoint {
  submittedAt: string | null
  moduleCode: string
  subjectName: string
  scorePercentage: number
  label: string
}

export interface StudentDashboardAnalytics {
  summaryCards: StudentSummaryCard[]
  progress: StudentProgressMetrics
  nextAssessment: StudentNextAssessment | null
  recentResults: StudentRecentResult[]
  learningMaterials: StudentLearningMaterialGroupRecord[]
  performanceTrend: StudentPerformanceTrendPoint[]
  assessmentCount: number
}
