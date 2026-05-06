'use client'

import * as React from 'react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'

import type { StudentPerformanceTrendPoint } from '@/lib/supabase/student-dashboard-types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

const chartConfig = {
  scorePercentage: {
    label: 'Score',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig

// StudentPerformanceTrendCard - render the student's score trend as a line chart
export function StudentPerformanceTrendCard({
  trend,
}: {
  trend: StudentPerformanceTrendPoint[]
}) {
  const chartData = React.useMemo(
    () =>
      trend.map((point) => ({
        ...point,
        scorePercentage: point.scorePercentage,
      })),
    [trend]
  )

  const averageScore = React.useMemo(() => {
    if (!chartData.length) {
      return 0
    }

    return chartData.reduce((total, point) => total + point.scorePercentage, 0) / chartData.length
  }, [chartData])

  const latestPoint = chartData.length > 0 ? chartData[chartData.length - 1] : null

  return (
    <Card className="flex flex-col">
      <CardHeader className="px-4 pt-4">
        <div className="space-y-1">
          <CardTitle>Performance Trend</CardTitle>
          <CardDescription>Track your recent assessment scores over time.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <LineChart data={chartData} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-scorePercentage)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--color-scorePercentage)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} className="stroke-muted/40" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                className="text-xs"
                minTickGap={18}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                className="text-xs"
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <Line
                dataKey="scorePercentage"
                type="monotone"
                stroke="var(--color-scorePercentage)"
                strokeWidth={3}
                dot={{ r: 3, fill: 'var(--color-scorePercentage)', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                fill="url(#scoreGradient)"
              />
            </LineChart>
          </ChartContainer>
        ) : (
          <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No finished assessments yet.
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2 px-4 pb-4 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="rounded-md border-border/60 bg-background px-2 py-1 text-xs">
            {averageScore.toFixed(1)}% avg
          </Badge>
          <span className="text-muted-foreground">
            {latestPoint ? `Latest: ${latestPoint.moduleCode} at ${latestPoint.label}` : 'No recent score available'}
          </span>
        </div>
        <p className="leading-none text-muted-foreground">Showing the latest 6 finished assessments.</p>
      </CardFooter>
    </Card>
  )
}
