import { IconEye, IconTrendingUp, IconTrophy } from '@tabler/icons-react'

import type { AdminTopStudentRow } from '@/lib/supabase/admin-dashboard-types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

// TopStudentsPanel - render the top students using the original ranked-list layout
export function TopStudentsPanel({ students }: { students: AdminTopStudentRow[] }) {
  return (
    <Card className="cursor-pointer">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Top Students</CardTitle>
          <CardDescription>Highest performing students across the latest finished assessments.</CardDescription>
        </div>
        <Button variant="outline" size="sm" className="cursor-pointer">
          <IconEye className="mr-2 h-4 w-4" />
          View All
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {students.length > 0 ? (
          students.map((student, index) => (
            <div key={student.studentId} className="flex items-center p-3 rounded-lg border gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                #{index + 1}
              </div>
              <div className="flex gap-2 items-center justify-between space-x-3 flex-1 flex-wrap">
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium truncate">{student.studentName}</p>
                    <Badge variant="outline" className="text-xs">
                      {student.studentCode}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex items-center space-x-1">
                      <IconTrophy className="h-3 w-3 text-yellow-400" />
                      <span className="text-xs text-muted-foreground">{student.weightedAverage.toFixed(1)}%</span>
                    </div>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{student.finishedCount} finished</span>
                  </div>
                  <div className="mt-2 flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {student.subjectName}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {student.sectionName}
                    </Badge>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">{student.weightedAverage.toFixed(1)}%</p>
                    <Badge variant="outline" className="text-green-600 border-green-200 cursor-pointer">
                      <IconTrendingUp className="h-3 w-3 mr-1" />
                      {student.passedCount} passed
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">Finished: {student.finishedCount}</span>
                    <Progress
                      value={Math.max(0, Math.min(student.weightedAverage, 100))}
                      className="w-12 h-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No data found
          </div>
        )}
      </CardContent>
    </Card>
  )
}
