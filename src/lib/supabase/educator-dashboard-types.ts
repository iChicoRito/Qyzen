export interface EducatorSummaryCard {
  key: 'sections' | 'subjects' | 'modules' | 'students'
  label: string
  value: number
  helper: string
}

export interface EducatorAssessmentOverview {
  enrolledStudents: number
  activeModules: number
  quizQuestions: number
  finishedAssessments: number
  inProgressAssessments: number
  passedAssessments: number
  failedAssessments: number
  passRate: number
  averageScore: number
}

export interface EducatorSectionInsight {
  sectionId: number
  sectionName: string
  status: 'active' | 'inactive'
  subjectCount: number
  moduleCount: number
  studentCount: number
  finishedAssessmentCount: number
  passRate: number
}

export interface EducatorModuleInsight {
  moduleId: number
  moduleCode: string
  subjectName: string
  sectionName: string
  termName: string
  schedule: string
  status: 'active' | 'inactive'
  questionCount: number
  enrolledStudentCount: number
  finishedAssessmentCount: number
  passedAssessmentCount: number
  failedAssessmentCount: number
  passRate: number
}

export interface EducatorTopStudentRow {
  studentId: number
  studentName: string
  studentCode: string
  subjectName: string
  sectionName: string
  weightedAverage: number
  passedCount: number
  finishedCount: number
  latestSubmittedAt: string | null
}

export interface EducatorDashboardAnalytics {
  summaryCards: EducatorSummaryCard[]
  assessmentOverview: EducatorAssessmentOverview
  sectionInsights: EducatorSectionInsight[]
  moduleInsights: EducatorModuleInsight[]
  topStudents: EducatorTopStudentRow[]
}
