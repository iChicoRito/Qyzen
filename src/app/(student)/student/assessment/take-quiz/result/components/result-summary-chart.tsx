'use client'

import { PolarAngleAxis, RadialBar, RadialBarChart } from 'recharts'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

interface ResultSummaryChartProps {
  correctAnswers: number
  incorrectAnswers: number
  percentage: number
}

const chartConfig = {
  score: {
    label: 'Scored',
    color: 'var(--primary)',
  },
  remaining: {
    label: 'Remaining',
    color: 'var(--primary)',
  },
} satisfies ChartConfig

// ResultSummaryChart - render quiz result radial chart
export function ResultSummaryChart({
  correctAnswers,
  incorrectAnswers,
  percentage,
}: ResultSummaryChartProps) {
  const chartData = [
    {
      name: 'result',
      score: Math.max(percentage, 0),
      remaining: Math.max(100 - percentage, 0),
    },
  ]

  return (
    <div className="rounded-lg">
      <div className="space-y-1">
        <div className="text-foreground text-lg font-semibold">Performance Overview</div>
        <div className="text-muted-foreground text-sm">
          A quick look at your overall quiz completion score.
        </div>
      </div>
      <div className="mt-4 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Score Rate
      </div>
      <ChartContainer config={chartConfig} className="mx-auto mt-2 h-[220px] w-full max-w-[260px]">
        <RadialBarChart
          data={chartData}
          endAngle={0}
          innerRadius={62}
          outerRadius={96}
          startAngle={180}
          margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
        >
          <PolarAngleAxis domain={[0, 100]} tick={false} type="number" />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <RadialBar
            background
            cornerRadius={10}
            dataKey="remaining"
            fill="var(--primary)"
            fillOpacity={0.2}
            stackId="result"
          />
          <RadialBar
            cornerRadius={10}
            dataKey="score"
            fill="var(--color-score)"
            stackId="result"
          />
          <text
            className="fill-foreground text-2xl font-semibold"
            textAnchor="middle"
            x="50%"
            y="56%"
          >
            {percentage}%
          </text>
          <text
            className="fill-muted-foreground text-sm"
            textAnchor="middle"
            x="50%"
            y="68%"
          >
            Overall Score
          </text>
        </RadialBarChart>
      </ChartContainer>
      <div className="mt-3 grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg text-center">
          <div className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.18em]">Correct</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight">{correctAnswers}</div>
        </div>
        <div className="rounded-lg text-center">
          <div className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.18em]">Incorrect</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight">{incorrectAnswers}</div>
        </div>
      </div>
    </div>
  )
}
