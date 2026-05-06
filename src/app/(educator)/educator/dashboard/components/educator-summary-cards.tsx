import { IconArrowUpRight, IconBook2, IconChecklist, IconSchool, IconUsersGroup } from '@tabler/icons-react'

import type { EducatorSummaryCard } from '@/lib/supabase/educator-dashboard-types'
import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const iconMap = {
  sections: IconSchool,
  subjects: IconBook2,
  modules: IconChecklist,
  students: IconUsersGroup,
} satisfies Record<EducatorSummaryCard['key'], typeof IconUsersGroup>

// EducatorSummaryCards - render the educator summary metrics
export function EducatorSummaryCards({ cards }: { cards: EducatorSummaryCard[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const MetricIcon = iconMap[card.key]

        return (
          <Card key={card.key} className="cursor-pointer">
            <CardHeader>
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {card.value.toLocaleString()}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <MetricIcon className="h-4 w-4" />
                  Live
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                {card.helper} <IconArrowUpRight className="size-4" />
              </div>
              <div className="text-muted-foreground">Live totals from the database.</div>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
