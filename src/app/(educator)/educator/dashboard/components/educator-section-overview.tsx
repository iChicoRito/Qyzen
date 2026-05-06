import type { EducatorSectionInsight } from '@/lib/supabase/educator-dashboard-types'
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

// EducatorSectionOverviewCard - render section workload and outcome data
export function EducatorSectionOverviewCard({ sections }: { sections: EducatorSectionInsight[] }) {
  return (
    <Card>
      <CardHeader className="px-4 pt-4">
        <CardTitle>Section Overview</CardTitle>
        <CardDescription>Student counts, module coverage, and performance by section.</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 py-3 font-semibold">Section</TableHead>
                <TableHead className="px-4 py-3 font-semibold">Subjects</TableHead>
                <TableHead className="px-4 py-3 font-semibold">Modules</TableHead>
                <TableHead className="px-4 py-3 font-semibold">Students</TableHead>
                <TableHead className="px-4 py-3 font-semibold">Finished</TableHead>
                <TableHead className="px-4 py-3 font-semibold">Pass Rate</TableHead>
                <TableHead className="px-4 py-3 font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sections.length > 0 ? (
                sections.map((section) => (
                  <TableRow key={section.sectionId}>
                    <TableCell className="px-4 py-3 font-medium">{section.sectionName}</TableCell>
                    <TableCell className="px-4 py-3">{section.subjectCount}</TableCell>
                    <TableCell className="px-4 py-3">{section.moduleCount}</TableCell>
                    <TableCell className="px-4 py-3">{section.studentCount}</TableCell>
                    <TableCell className="px-4 py-3">{section.finishedAssessmentCount}</TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge className={getPassRateBadgeClassName(section.passRate)}>
                        {section.passRate.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant="outline" className="rounded-md border-border/60 bg-background px-2 py-1 text-xs">
                        {section.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="px-4 py-4 text-center text-sm text-muted-foreground">
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
