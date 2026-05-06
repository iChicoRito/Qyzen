import { IconDotsVertical, IconFileText } from '@tabler/icons-react'

import type { StudentLearningMaterialGroupRecord } from '@/lib/supabase/learning-materials'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// formatDateTime - convert timestamps into a student-facing label
function formatDateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

// StudentLearningMaterialsCard - render student-accessible learning materials
export function StudentLearningMaterialsCard({
  groups,
}: {
  groups: StudentLearningMaterialGroupRecord[]
}) {
  return (
    <Card>
      <CardHeader className="px-4 pt-4">
        <CardTitle>Learning Materials</CardTitle>
        <CardDescription>Recent files shared for your enrolled subject and section groups.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4">
        {groups.length > 0 ? (
          groups.slice(0, 3).map((group) => (
            <div key={`${group.subjectId}:${group.sectionId}`} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{group.subjectName}</div>
                  <div className="text-sm text-muted-foreground">{group.sectionName}</div>
                  <div className="mt-2 text-sm text-muted-foreground">{group.educatorName}</div>
                </div>
                <Badge variant="outline" className="rounded-md border-border/60 bg-background px-2 py-1 text-xs">
                  {group.totalFiles} files
                </Badge>
              </div>

              <div className="mt-3 space-y-2">
                {group.files.slice(0, 2).map((file) => (
                  <div key={file.id} className="flex items-center justify-between gap-2 rounded-md bg-muted/40 p-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <IconFileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{file.fileName}</div>
                        <div className="text-sm text-muted-foreground">{formatDateTime(file.updatedAt)}</div>
                      </div>
                    </div>
                    <IconDotsVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No learning materials found yet.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
