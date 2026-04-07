import { IconDotsVertical, IconFileText } from '@tabler/icons-react'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  fetchStudentLearningMaterialGroups,
  formatLearningMaterialFileSize,
  getLearningMaterialFileUrl,
  getLearningMaterialKindLabel,
} from '@/lib/supabase/learning-materials'
import { requireServerAuthContext } from '@/lib/auth/server'

// formatDateTime - convert timestamps into a compact student-facing label
function formatDateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

// StudentLearningMaterialsPage - show enrolled student learning materials grouped by class
export default async function StudentLearningMaterialsPage() {
  const context = await requireServerAuthContext('student')
  const groups = await fetchStudentLearningMaterialGroups(context.profile.id)

  return (
    <div className="flex min-w-0 flex-1 flex-col space-y-4 px-4 py-4 md:px-6">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Learning Materials</h1>
        <p className="text-sm text-muted-foreground">
          View and download the files shared for your enrolled subject and section groups.
        </p>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Learning Materials Found</CardTitle>
            <CardDescription>Your educator has not uploaded materials for your enrolled classes yet.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card className="gap-0 py-0">
          <CardContent className="p-0">
            <Accordion className="w-full" collapsible type="single">
              {groups.map((group) => (
                <AccordionItem
                  key={`${group.subjectId}:${group.sectionId}`}
                  className="border-b last:border-b-0"
                  value={`${group.subjectId}:${group.sectionId}`}
                >
                  <AccordionTrigger className="px-4 hover:no-underline md:px-6">
                    <div className="min-w-0 text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="truncate text-base font-semibold">{group.subjectName}</div>
                        <Badge className="px-2 py-0.5" variant="outline">
                          {group.sectionName}
                        </Badge>
                      </div>
                      <div className="mt-2 text-sm uppercase text-muted-foreground">
                        Educator: {group.educatorName}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 md:px-6">
                    <div className="space-y-3">
                      {group.files.map((material) => (
                        <div
                          key={material.id}
                          className="flex items-center gap-3 rounded-md border p-3"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <IconFileText className="shrink-0" size={16} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{material.fileName}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <span>{formatLearningMaterialFileSize(material.fileSize)}</span>
                                <span>{formatDateTime(material.updatedAt)}</span>
                                <span
                                  className={
                                    getLearningMaterialKindLabel(material.fileExtension) === 'Presentation'
                                      ? 'rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-blue-500'
                                      : 'rounded-md border-0 bg-yellow-500/10 px-2.5 py-0.5 text-yellow-500'
                                  }
                                >
                                  {getLearningMaterialKindLabel(material.fileExtension)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                aria-label={`Open actions for ${material.fileName}`}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-[3px]"
                                type="button"
                              >
                                <IconDotsVertical size={18} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <a href={getLearningMaterialFileUrl(material.id)} rel="noreferrer" target="_blank">
                                  View
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <a href={getLearningMaterialFileUrl(material.id, true)} rel="noreferrer" target="_blank">
                                  Download
                                </a>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
