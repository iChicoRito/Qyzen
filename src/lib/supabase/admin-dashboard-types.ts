export interface AdminSummaryCard {
  key: 'students' | 'educators' | 'sections' | 'subjects'
  label: string
  value: number
  helper: string
}

export interface AdminAssessmentOverview {
  enrolledStudents: number
  finishedAssessments: number
  passedAssessments: number
  failedAssessments: number
}

export interface AdminAssessmentStatusDatum {
  key: 'notStarted' | 'inProgress' | 'passed' | 'failed'
  label: string
  value: number
  fill: string
}

export interface AdminTopStudentRow {
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

export interface AdminStudentInsightDatum {
  monthKey: string
  monthLabel: string
  enrolledCount: number
  finishedCount: number
  passedCount: number
}

export interface AdminStudentInsightMetrics {
  totalEnrolledStudents: number
  finishedAssessments: number
  passRate: number
}

export interface AdminEducatorInsightRow {
  educatorId: number
  educatorName: string
  educatorEmail: string
  sectionCount: number
  subjectCount: number
  enrolledStudentCount: number
  finishedAssessmentCount: number
  passRate: number
}

export interface AdminAssessmentInsightRow {
  moduleId: number
  moduleCode: string
  subjectName: string
  sectionName: string
  educatorName: string
  enrolledStudentCount: number
  finishedAssessmentCount: number
  passedAssessmentCount: number
  failedAssessmentCount: number
}

export interface AdminDashboardAnalytics {
  summaryCards: AdminSummaryCard[]
  assessmentOverview: AdminAssessmentOverview
  assessmentStatusChart: AdminAssessmentStatusDatum[]
  topStudents: AdminTopStudentRow[]
  studentInsights: {
    chartData: AdminStudentInsightDatum[]
    metrics: AdminStudentInsightMetrics
  }
  educatorInsights: AdminEducatorInsightRow[]
  assessmentInsights: AdminAssessmentInsightRow[]
}

