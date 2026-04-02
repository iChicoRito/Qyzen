"use client"

import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { StudentAssessmentRecord } from "@/lib/supabase/student-assessments"
import { useQuiz } from "../use-quiz"

interface QuizListProps {
  items: StudentAssessmentRecord[];
  isMobile?: boolean;
}

// buildScheduleDateTime - combine date and time for status updates
function buildScheduleDateTime(date: string, time: string) {
  return new Date(`${date}T${time}`);
}

// getAvailabilityStatusNow - resolve the live availability status
function getAvailabilityStatusNow(item: StudentAssessmentRecord, now: Date) {
  const startDateTime = buildScheduleDateTime(item.startDate, item.startTime);
  const endDateTime = buildScheduleDateTime(item.endDate, item.endTime);

  if (Number.isNaN(startDateTime.getTime()) || Number.isNaN(endDateTime.getTime())) {
    return "invalid" as const;
  }

  if (now < startDateTime) {
    return "upcoming" as const;
  }

  if (now > endDateTime && !item.isExpiredOverrideActive) {
    return "expired" as const;
  }

  return "available" as const;
}

// getAvailabilityStatusLabel - format the availability badge text
function getAvailabilityStatusLabel(
  availabilityStatus: StudentAssessmentRecord["availabilityStatus"],
  isExpiredOverrideActive: boolean,
  isFinished: boolean
) {
  if (isFinished) {
    return "finished";
  }

  if (availabilityStatus === "available") {
    return isExpiredOverrideActive ? "reopened" : "available";
  }

  if (availabilityStatus === "upcoming") {
    return "not started";
  }

  if (availabilityStatus === "expired") {
    return "expired";
  }

  return "schedule issue";
}

// getAvailabilityStatusClassName - build the availability badge classes
function getAvailabilityStatusClassName(
  availabilityStatus: StudentAssessmentRecord["availabilityStatus"],
  isExpiredOverrideActive: boolean,
  isFinished: boolean
) {
  if (isFinished) {
    return "rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500";
  }

  if (availabilityStatus === "available") {
    return isExpiredOverrideActive
      ? "rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-blue-500"
      : "rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500";
  }

  if (availabilityStatus === "upcoming") {
    return "rounded-md border-0 bg-yellow-500/10 px-2.5 py-0.5 text-yellow-500";
  }

  if (availabilityStatus === "expired") {
    return "rounded-md border-0 bg-rose-500/10 px-2.5 py-0.5 text-rose-500";
  }

  return "rounded-md border-0 bg-rose-500/10 px-2.5 py-0.5 text-rose-500";
}

// QuizList - renders the assessment list
export function QuizList({ items, isMobile = false }: QuizListProps) {
  // selected assessment state
  const [quiz, setQuiz] = useQuiz();
  const [currentTime, setCurrentTime] = useState(() => new Date());

  // ==================== LIVE STATUS TIMER ====================
  useEffect(() => {
    const hasUpcomingItem = items.some((item) => getAvailabilityStatusNow(item, currentTime) === "upcoming");

    if (!hasUpcomingItem) {
      return;
    }

    const interval = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [currentTime, items]);

  return (
    <ScrollArea className={cn("min-h-0", !isMobile && "h-[calc(100vh-12rem)]")}>
      <div className="flex flex-col gap-3 p-4">{items.map((item) => (
          (() => {
            const availabilityStatusNow = getAvailabilityStatusNow(item, currentTime);

            return (
          <button
            key={item.id}
            className={cn(
              "hover:bg-accent hover:text-accent-foreground flex w-full flex-col items-start gap-3 rounded-lg border p-4 text-left text-sm transition-all cursor-pointer",
              quiz.selected === item.id && "bg-muted"
            )}
            onClick={() =>
              setQuiz({
                ...quiz,
                selected: item.id,
              })
            }
          >
            <div className="flex w-full flex-col gap-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="min-w-0 break-words font-semibold">{item.subjectName}</div>
                  {!item.read && <span className="flex size-2 rounded-full bg-blue-600 cursor-pointer" />}
                </div>
                <div
                  className={cn(
                    "text-xs break-words sm:ml-auto",
                    quiz.selected === item.id ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {item.moduleCode}
                </div>
              </div>
              <div className="text-xs font-medium break-words">
                {item.sectionName} - {item.termName}
              </div>
            </div>
            <div className="text-muted-foreground flex flex-wrap gap-3 text-xs">
              <span>{item.questionCount} question{item.questionCount === 1 ? "" : "s"}</span>
              <span>{item.quizTypeLabel}</span>
              <span>{item.timeLimitMinutes} min</span>
            </div>
            {item.labels.length ? (
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={cn("border-0 uppercase", getAvailabilityStatusClassName(availabilityStatusNow, item.isExpiredOverrideActive, item.isFinished))}>
                  {getAvailabilityStatusLabel(availabilityStatusNow, item.isExpiredOverrideActive, item.isFinished)}
                </Badge>
                {!item.hasQuestions ? (
                  <Badge className="rounded-md border-0 bg-rose-500/10 px-2.5 py-0.5 text-rose-500 uppercase">
                    no questions yet
                  </Badge>
                ) : null}
              </div>
            ) : null}
          </button>
            );
          })()
        ))}
      </div>
    </ScrollArea>
  );
}
