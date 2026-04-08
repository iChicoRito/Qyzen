import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// Loading - render the admin dashboard skeleton state
export default function Loading() {
  return (
    <div className="flex-1 space-y-4 px-4 pt-0 md:px-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="px-4 pt-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-20" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <Skeleton className="h-4 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-72 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
