'use client'

import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  IconArrowUp,
  IconChecklist,
  IconSchool,
  IconTarget,
  IconUserCheck,
  IconUsersGroup,
} from '@tabler/icons-react'

import type {
  AdminAssessmentInsightRow,
  AdminEducatorInsightRow,
  AdminStudentInsightDatum,
  AdminStudentInsightMetrics,
} from '@/lib/supabase/admin-dashboard-types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const chartConfig = {
  enrolledCount: {
    label: 'Enrolled',
    color: 'var(--chart-1)',
  },
  finishedCount: {
    label: 'Finished',
    color: 'var(--chart-2)',
  },
  passedCount: {
    label: 'Passed',
    color: 'var(--chart-3)',
  },
}

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

// AdminInsightsPanel - render the original tabbed insights layout with admin data
export function AdminInsightsPanel({
  studentChartData,
  studentMetrics,
  educatorRows,
  assessmentRows,
}: {
  studentChartData: AdminStudentInsightDatum[]
  studentMetrics: AdminStudentInsightMetrics
  educatorRows: AdminEducatorInsightRow[]
  assessmentRows: AdminAssessmentInsightRow[]
}) {
  const [activeTab, setActiveTab] = useState('students')

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Admin Insights</CardTitle>
        <CardDescription>Students, educators, and assessment monitoring from live data.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-lg h-12">
            <TabsTrigger
              value="students"
              className="cursor-pointer flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground"
            >
              <IconUsersGroup className="h-4 w-4" />
              <span className="hidden sm:inline">Students</span>
            </TabsTrigger>
            <TabsTrigger
              value="educators"
              className="cursor-pointer flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground"
            >
              <IconSchool className="h-4 w-4" />
              <span className="hidden sm:inline">Educators</span>
            </TabsTrigger>
            <TabsTrigger
              value="assessments"
              className="cursor-pointer flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground"
            >
              <IconChecklist className="h-4 w-4" />
              <span className="hidden sm:inline">Assessments</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="mt-8 space-y-6">
            <div className="grid gap-6">
              <div className="grid grid-cols-10 gap-6">
                <div className="col-span-10 xl:col-span-7">
                  <h3 className="text-sm font-medium text-muted-foreground mb-6">Student Activity Trends</h3>
                  {studentChartData.some((item) => item.enrolledCount || item.finishedCount || item.passedCount) ? (
                    <ChartContainer config={chartConfig} className="h-[375px] w-full">
                      <BarChart data={studentChartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="monthLabel"
                          className="text-xs"
                          tick={{ fontSize: 12 }}
                          tickLine={{ stroke: 'var(--border)' }}
                          axisLine={{ stroke: 'var(--border)' }}
                        />
                        <YAxis
                          className="text-xs"
                          tick={{ fontSize: 12 }}
                          tickLine={{ stroke: 'var(--border)' }}
                          axisLine={{ stroke: 'var(--border)' }}
                          domain={[0, 'dataMax']}
                          allowDecimals={false}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="enrolledCount" fill="var(--color-enrolledCount)" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="finishedCount" fill="var(--color-finishedCount)" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="passedCount" fill="var(--color-passedCount)" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <div className="flex items-center justify-center rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                      No data found
                    </div>
                  )}
                </div>

                <div className="col-span-10 xl:col-span-3 space-y-5">
                  <h3 className="text-sm font-medium text-muted-foreground mb-6">Key Metrics</h3>
                  <div className="grid grid-cols-3 gap-5">
                    <div className="p-4 rounded-lg max-lg:col-span-3 xl:col-span-3 border">
                      <div className="flex items-center gap-2 mb-2">
                        <IconUsersGroup className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Total Enrolled Students</span>
                      </div>
                      <div className="text-2xl font-bold">{studentMetrics.totalEnrolledStudents.toLocaleString()}</div>
                      <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <IconArrowUp className="h-3 w-3" />
                        Active from enrollment data
                      </div>
                    </div>

                    <div className="p-4 rounded-lg max-lg:col-span-3 xl:col-span-3 border">
                      <div className="flex items-center gap-2 mb-2">
                        <IconChecklist className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Finished Assessments</span>
                      </div>
                      <div className="text-2xl font-bold">{studentMetrics.finishedAssessments.toLocaleString()}</div>
                      <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <IconArrowUp className="h-3 w-3" />
                        Latest submitted attempts
                      </div>
                    </div>

                    <div className="p-4 rounded-lg max-lg:col-span-3 xl:col-span-3 border">
                      <div className="flex items-center gap-2 mb-2">
                        <IconTarget className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Current Pass Rate</span>
                      </div>
                      <div className="text-2xl font-bold">{studentMetrics.passRate.toFixed(1)}%</div>
                      <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <IconArrowUp className="h-3 w-3" />
                        Based on finished assessments
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="educators" className="mt-8">
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="py-5 px-6 font-semibold">Educator</TableHead>
                    <TableHead className="py-5 px-6 font-semibold">Email</TableHead>
                    <TableHead className="text-right py-5 px-6 font-semibold">Sections</TableHead>
                    <TableHead className="text-right py-5 px-6 font-semibold">Subjects</TableHead>
                    <TableHead className="text-right py-5 px-6 font-semibold">Students</TableHead>
                    <TableHead className="text-right py-5 px-6 font-semibold">Finished</TableHead>
                    <TableHead className="text-right py-5 px-6 font-semibold">Pass Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {educatorRows.length > 0 ? (
                    educatorRows.map((row) => (
                      <TableRow key={row.educatorId} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium py-5 px-6">{row.educatorName}</TableCell>
                        <TableCell className="py-5 px-6">{row.educatorEmail}</TableCell>
                        <TableCell className="text-right py-5 px-6">{row.sectionCount}</TableCell>
                        <TableCell className="text-right py-5 px-6">{row.subjectCount}</TableCell>
                        <TableCell className="text-right py-5 px-6">{row.enrolledStudentCount}</TableCell>
                        <TableCell className="text-right py-5 px-6">{row.finishedAssessmentCount}</TableCell>
                        <TableCell className="text-right py-5 px-6">
                          <Badge className={getPassRateBadgeClassName(row.passRate)}>{row.passRate.toFixed(1)}%</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="py-5 px-6 text-center text-muted-foreground">
                        No data found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-6">
              <div className="text-muted-foreground text-sm hidden sm:block">
                {educatorRows.length} row(s) loaded.
              </div>
              <div className="space-x-2 space-y-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="assessments" className="mt-8">
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="py-5 px-6 font-semibold">Module</TableHead>
                    <TableHead className="py-5 px-6 font-semibold">Subject</TableHead>
                    <TableHead className="py-5 px-6 font-semibold">Section</TableHead>
                    <TableHead className="py-5 px-6 font-semibold">Educator</TableHead>
                    <TableHead className="text-right py-5 px-6 font-semibold">Enrolled</TableHead>
                    <TableHead className="text-right py-5 px-6 font-semibold">Finished</TableHead>
                    <TableHead className="text-right py-5 px-6 font-semibold">Passed</TableHead>
                    <TableHead className="text-right py-5 px-6 font-semibold">Failed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessmentRows.length > 0 ? (
                    assessmentRows.map((row) => (
                      <TableRow key={row.moduleId} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium py-5 px-6">{row.moduleCode}</TableCell>
                        <TableCell className="py-5 px-6">{row.subjectName}</TableCell>
                        <TableCell className="py-5 px-6">{row.sectionName}</TableCell>
                        <TableCell className="py-5 px-6">{row.educatorName}</TableCell>
                        <TableCell className="text-right py-5 px-6">{row.enrolledStudentCount}</TableCell>
                        <TableCell className="text-right py-5 px-6">{row.finishedAssessmentCount}</TableCell>
                        <TableCell className="text-right py-5 px-6 text-green-500">{row.passedAssessmentCount}</TableCell>
                        <TableCell className="text-right py-5 px-6 text-rose-500">{row.failedAssessmentCount}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="py-5 px-6 text-center text-muted-foreground">
                        No data found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-6">
              <div className="text-muted-foreground text-sm hidden sm:block">
                {assessmentRows.length} row(s) loaded.
              </div>
              <div className="space-x-2 space-y-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
