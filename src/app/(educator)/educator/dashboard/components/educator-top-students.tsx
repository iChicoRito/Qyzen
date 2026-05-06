import { IconTrophy, IconTrendingUp } from '@tabler/icons-react'

import type { EducatorTopStudentRow } from '@/lib/supabase/educator-dashboard-types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

// EducatorTopStudentsCard - render the top student list
export function EducatorTopStudentsCard({ students }: { students: EducatorTopStudentRow[] }) {
  return (
    <Card>
      <CardHeader className="px-4 pt-4 pb-4">
        <div className="space-y-1">
          <CardTitle>Top Students</CardTitle>
          <CardDescription>Highest performing students across your latest finished assessments.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4">
        {students.length > 0 ? (
          students.map((student, index) => (
            <div key={student.studentId} className="flex flex-wrap items-center gap-3 rounded-lg border p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold text-primary">
                #{index + 1}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium">{student.studentName}</p>
                  <Badge variant="outline" className="rounded-md border-border/60 bg-background px-2 py-1 text-xs">
                    {student.studentCode}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {student.subjectName} in {student.sectionName}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <IconTrophy className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-muted-foreground">{student.finishedCount} finished</span>
                  <span className="text-sm text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">{student.passedCount} passed</span>
                </div>
              </div>

              <div className="w-full sm:w-auto sm:min-w-[10rem]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium tabular-nums">{student.weightedAverage.toFixed(1)}%</span>
                  <Badge variant="outline" className="rounded-md border-green-500/20 bg-green-500/10 px-2 py-1 text-xs text-green-500">
                    <IconTrendingUp className="mr-1 h-3 w-3" />
                    Live
                  </Badge>
                </div>
                <Progress value={Math.max(0, Math.min(student.weightedAverage, 100))} className="mt-2 h-2" />
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No data found</div>
        )}
      </CardContent>
    </Card>
  )
}
