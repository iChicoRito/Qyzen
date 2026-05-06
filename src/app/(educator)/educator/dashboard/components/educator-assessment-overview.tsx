'use client'

import * as React from 'react'
import { Label, Pie, PieChart } from 'recharts'
import {
  IconArrowUpRight,
  IconChartPie,
  IconChecklist,
  IconUsersGroup,
} from '@tabler/icons-react'

import type { EducatorAssessmentOverview } from '@/lib/supabase/educator-dashboard-types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

const chartConfig = {
  finished: {
    label: 'Finished',
    color: 'var(--chart-2)',
  },
  inProgress: {
    label: 'In Progress',
    color: 'var(--chart-3)',
  },
  passed: {
    label: 'Passed',
    color: 'var(--chart-1)',
  },
  failed: {
    label: 'Failed',
    color: 'var(--chart-4)',
  },
} satisfies ChartConfig

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

// EducatorAssessmentOverviewCard - render the educator assessment summary chart
export function EducatorAssessmentOverviewCard({
  assessmentOverview,
}: {
  assessmentOverview: EducatorAssessmentOverview
}) {
  const chartData = React.useMemo(
    () => [
      {
        key: 'finished',
        label: 'Finished',
        value: assessmentOverview.finishedAssessments,
        fill: 'var(--color-finished)',
      },
      {
        key: 'inProgress',
        label: 'In Progress',
        value: assessmentOverview.inProgressAssessments,
        fill: 'var(--color-inProgress)',
      },
      {
        key: 'passed',
        label: 'Passed',
        value: assessmentOverview.passedAssessments,
        fill: 'var(--color-passed)',
      },
      {
        key: 'failed',
        label: 'Failed',
        value: assessmentOverview.failedAssessments,
        fill: 'var(--color-failed)',
      },
    ],
    [assessmentOverview]
  )

  const totalStatuses = React.useMemo(
    () => chartData.reduce((total, item) => total + item.value, 0),
    [chartData]
  )
  const activeIndex = React.useMemo(() => {
    const index = chartData.findIndex((item) => item.value > 0)
    return index === -1 ? 0 : index
  }, [chartData])

  const selectedItem = chartData[activeIndex] || chartData[0]
  const activePieProps = { activeIndex } as unknown as Record<string, unknown>

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Assessment Overview</CardTitle>
        <CardDescription>Live assessment status distribution from your enrolled modules.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        {totalStatuses > 0 ? (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square w-full max-h-[260px] pb-0 [&_.recharts-pie-label-text]:fill-foreground"
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                {...activePieProps}
                data={chartData}
                dataKey="value"
                nameKey="label"
                innerRadius={72}
                outerRadius={112}
                strokeWidth={5}
                label
              >
                <Label
                  content={({ viewBox }) => {
                    if (!viewBox || !('cx' in viewBox) || !('cy' in viewBox)) {
                      return null
                    }

                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-bold">
                          {selectedItem?.value.toLocaleString() ?? '0'}
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 22} className="fill-muted-foreground">
                          {selectedItem?.label ?? 'Status'}
                        </tspan>
                      </text>
                    )
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="flex min-h-[260px] items-center justify-center rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No data found
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={getPassRateBadgeClassName(assessmentOverview.passRate)}>
            {assessmentOverview.passRate.toFixed(1)}%
          </Badge>
          <span className="flex items-center gap-2 leading-none font-medium">
            Pass rate
            <IconArrowUpRight className="h-4 w-4" />
          </span>
        </div>
        <div className="leading-none text-muted-foreground">
          Showing assessment status for {assessmentOverview.finishedAssessments.toLocaleString()} finished assessments
        </div>
        <div className="flex flex-wrap gap-3 text-muted-foreground">
          <span className="flex items-center gap-1">
            <IconUsersGroup className="h-4 w-4" />
            {assessmentOverview.enrolledStudents.toLocaleString()} enrolled
          </span>
          <span className="flex items-center gap-1">
            <IconChecklist className="h-4 w-4" />
            {assessmentOverview.activeModules.toLocaleString()} modules
          </span>
          <span className="flex items-center gap-1">
            <IconChartPie className="h-4 w-4" />
            {assessmentOverview.quizQuestions.toLocaleString()} quiz items
          </span>
          <span className="flex items-center gap-1">
            {assessmentOverview.averageScore.toFixed(1)}% average
          </span>
        </div>
      </CardFooter>
    </Card>
  )
}
