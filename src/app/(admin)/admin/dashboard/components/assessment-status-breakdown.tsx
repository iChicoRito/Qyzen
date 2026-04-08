'use client'

import * as React from 'react'
import { Label, Pie, PieChart, Sector } from 'recharts'
import type { PieSectorDataItem } from 'recharts/types/polar/Pie'

import type {
  AdminAssessmentOverview,
  AdminAssessmentStatusDatum,
} from '@/lib/supabase/admin-dashboard-types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartStyle, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const chartConfig = {
  notStarted: {
    label: 'Not Started',
    color: 'var(--chart-4)',
  },
  inProgress: {
    label: 'In Progress',
    color: 'var(--chart-3)',
  },
  passed: {
    label: 'Passed',
    color: 'var(--chart-2)',
  },
  failed: {
    label: 'Failed',
    color: 'var(--chart-1)',
  },
}

// AssessmentStatusBreakdown - render the assessment breakdown using the shadcn interactive pie chart style
export function AssessmentStatusBreakdown({
  assessmentOverview,
  chartData,
}: {
  assessmentOverview: AdminAssessmentOverview
  chartData: AdminAssessmentStatusDatum[]
}) {
  const id = 'assessment-breakdown'
  const [activeCategory, setActiveCategory] = React.useState<AdminAssessmentStatusDatum['key']>(
    chartData[0]?.key || 'notStarted'
  )

  const activeIndex = React.useMemo(() => {
    const index = chartData.findIndex((item) => item.key === activeCategory)
    return index === -1 ? 0 : index
  }, [activeCategory, chartData])

  const pieChartData = React.useMemo(
    () =>
      chartData.map((item) => ({
        key: item.key,
        value: item.value,
        fill: item.fill,
      })),
    [chartData]
  )

  const selectedItem = chartData[activeIndex] || null
  const activePieProps = { activeIndex } as unknown as Record<string, unknown>
  const totalStatuses = React.useMemo(
    () => chartData.reduce((total, item) => total + item.value, 0),
    [chartData]
  )

  return (
    <Card data-chart={id} className="flex flex-col cursor-pointer">
      <ChartStyle id={id} config={chartConfig} />
      <CardHeader className="flex flex-col space-y-2 pb-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <CardTitle>Assessment Breakdown</CardTitle>
          <CardDescription>
            Enrolled students: {assessmentOverview.enrolledStudents.toLocaleString()} | Finished:{' '}
            {assessmentOverview.finishedAssessments.toLocaleString()} | Passed:{' '}
            {assessmentOverview.passedAssessments.toLocaleString()} | Failed:{' '}
            {assessmentOverview.failedAssessments.toLocaleString()}
          </CardDescription>
        </div>
        <Select
          value={activeCategory}
          onValueChange={(value) => setActiveCategory(value as AdminAssessmentStatusDatum['key'])}
        >
          <SelectTrigger className="w-[180px] rounded-lg cursor-pointer" aria-label="Select status">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent align="end" className="rounded-lg">
            {chartData.map((item) => (
              <SelectItem key={item.key} value={item.key} className="rounded-md [&_span]:flex cursor-pointer">
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-3 w-3 shrink-0 rounded-sm"
                    style={{ backgroundColor: item.fill }}
                  />
                  {item.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex flex-1 justify-center pb-6">
        {chartData.some((item) => item.value > 0) ? (
          <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="flex items-center justify-center">
              <ChartContainer
                id={id}
                config={chartConfig}
                className="mx-auto aspect-square w-full max-w-[340px]"
              >
                <PieChart>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    {...activePieProps}
                    data={pieChartData}
                    dataKey="value"
                    nameKey="key"
                    innerRadius={72}
                    outerRadius={112}
                    strokeWidth={5}
                    activeShape={({ outerRadius = 0, ...props }: PieSectorDataItem) => (
                      <g>
                        <Sector {...props} outerRadius={outerRadius + 10} />
                        <Sector
                          {...props}
                          outerRadius={outerRadius + 24}
                          innerRadius={outerRadius + 12}
                        />
                      </g>
                    )}
                  >
                    <Label
                      content={({ viewBox }) => {
                        if (!viewBox || !('cx' in viewBox) || !('cy' in viewBox)) {
                          return null
                        }

                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-3xl font-bold"
                            >
                              {selectedItem?.value.toLocaleString() ?? '0'}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground"
                            >
                              {selectedItem?.label ?? 'Status'}
                            </tspan>
                          </text>
                        )
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
            </div>

            <div className="flex flex-col justify-center space-y-4">
              {chartData.map((item, index) => {
                const isActive = index === activeIndex
                const percentage = Math.round((item.value / Math.max(totalStatuses, 1)) * 100)

                return (
                  <div
                    key={item.key}
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${
                      isActive ? 'bg-muted' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setActiveCategory(item.key)}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{item.value.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">{percentage}%</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="flex w-full items-center justify-center rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No data found
          </div>
        )}
      </CardContent>
    </Card>
  )
}
