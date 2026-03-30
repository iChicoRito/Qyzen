"use client"

import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Quiz } from "../data"
import { useQuiz } from "../use-quiz"

interface QuizListProps {
  items: Quiz[];
}

// QuizList - renders the assessment list
export function QuizList({ items }: QuizListProps) {
  // selected assessment state
  const [quiz, setQuiz] = useQuiz();

  return (
    <ScrollArea className="h-[calc(100vh-12rem)]">
      <div className="flex flex-col gap-2 p-4 pt-0">{items.map((item) => (
          <button
            key={item.id}
            className={cn(
              "hover:bg-accent hover:text-accent-foreground flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all cursor-pointer",
              quiz.selected === item.id && "bg-muted"
            )}
            onClick={() =>
              setQuiz({
                ...quiz,
                selected: item.id,
              })
            }
          >
            <div className="flex w-full flex-col gap-1">
              <div className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">{item.name}</div>
                  {!item.read && <span className="flex size-2 rounded-full bg-blue-600 cursor-pointer" />}
                </div>
                <div
                  className={cn(
                    "ml-auto text-xs",
                    quiz.selected === item.id ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {item.assessmentType}
                </div>
              </div>
              <div className="text-xs font-medium">{item.subject}</div>
            </div>
            <div className="text-muted-foreground line-clamp-2 text-xs">
              {item.text.substring(0, 300)}
            </div>
            {item.labels.length ? (
              <div className="flex items-center gap-2">
                {item.labels.map((label) => (
                  <Badge key={label} variant={getBadgeVariantFromLabel(label)} className={cn("cursor-pointer border-0", getBadgeClassName(label))}>
                    {label}
                  </Badge>
                ))}
              </div>
            ) : null}
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}

// getBadgeVariantFromLabel - returns the badge variant
function getBadgeVariantFromLabel(label: string): ComponentProps<typeof Badge>["variant"] {
  return "secondary";
}

// getBadgeClassName - returns the badge color classes
function getBadgeClassName(label: string): string {
  if (label.toLowerCase() === "pending") {
    return "rounded-md border-0 bg-yellow-500/10 px-2.5 py-0.5 text-yellow-500";
  }

  if (label.toLowerCase() === "finished") {
    return "rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500";
  }

  return "rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-blue-500";
}
