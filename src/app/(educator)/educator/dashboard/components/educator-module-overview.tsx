import type { EducatorModuleInsight } from '@/lib/supabase/educator-dashboard-types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// getPassRateBadgeClassName - return the pass rate badge styling
function getPassRateBadgeClassName(passRate: number) {
  if (passRate >= 75) {
    return 'rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500'
  }

  if (passRate >= 50) {
    return 'rounded-md border-0 bg-yellow-500/10 px-2.5 py-0.5 text-yellow-500'
  }

  return 'rounded-md border-0 bg-rose-500/10 px-2.5 py-0.5 text-rose-500'
}

// EducatorModuleOverviewCard - render module performance and coverage
export function EducatorModuleOverviewCard({ modules }: { modules: EducatorModuleInsight[] }) {
  return (
    <Card>
      <CardHeader className="px-4 pt-4">
        <CardTitle>Module Overview</CardTitle>
        <CardDescription>Question coverage, completion counts, and pass rate per module.</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 py-3 font-semibold">Module</TableHead>
                <TableHead className="px-4 py-3 font-semibold">Subject</TableHead>
                <TableHead className="px-4 py-3 font-semibold">Section</TableHead>
                <TableHead className="px-4 py-3 font-semibold">Questions</TableHead>
                <TableHead className="px-4 py-3 font-semibold">Enrolled</TableHead>
                <TableHead className="px-4 py-3 font-semibold">Finished</TableHead>
                <TableHead className="px-4 py-3 font-semibold">Pass Rate</TableHead>
                <TableHead className="px-4 py-3 font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modules.length > 0 ? (
                modules.map((module) => (
                  <TableRow key={module.moduleId}>
                    <TableCell className="px-4 py-3">
                      <div className="font-medium">{module.moduleCode}</div>
                      <div className="text-sm text-muted-foreground">{module.termName}</div>
                      <div className="text-sm text-muted-foreground">{module.schedule}</div>
                    </TableCell>
                    <TableCell className="px-4 py-3">{module.subjectName}</TableCell>
                    <TableCell className="px-4 py-3">{module.sectionName}</TableCell>
                    <TableCell className="px-4 py-3">{module.questionCount}</TableCell>
                    <TableCell className="px-4 py-3">{module.enrolledStudentCount}</TableCell>
                    <TableCell className="px-4 py-3">{module.finishedAssessmentCount}</TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge className={getPassRateBadgeClassName(module.passRate)}>
                        {module.passRate.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant="outline" className="rounded-md border-border/60 bg-background px-2 py-1 text-xs">
                        {module.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="px-4 py-4 text-center text-sm text-muted-foreground">
                    No data found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
