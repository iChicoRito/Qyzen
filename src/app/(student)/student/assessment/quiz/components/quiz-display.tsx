"use client"

import {
  IconArrowForward,
  IconArchive,
  IconArchiveOff,
  IconClock,
  IconCornerUpLeft,
  IconCornerUpRight,
  IconDotsVertical,
  IconFileTypePpt,
  IconTrash,
} from "@tabler/icons-react";

import { DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import type { StudentAssessmentRecord } from "@/lib/supabase/student-assessments";

interface QuizDisplayProps {
  quiz: StudentAssessmentRecord | null;
}

// ScheduleInfo - renders the assessment schedule details
function ScheduleInfo({ quiz }: { quiz: StudentAssessmentRecord }) {
  return (
    <div className="text-muted-foreground text-xs">{quiz.schedule}</div>
  );
}

// AttachmentCard - renders the fake study material file
function AttachmentCard({ quiz }: { quiz: StudentAssessmentRecord }) {
  return (
    <div className="bg-card flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-rose-500/10 p-2 text-rose-500">
          <IconFileTypePpt size={20} />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-medium">{quiz.attachmentName}</div>
          <div className="text-muted-foreground text-xs">
            {quiz.attachmentLabel} - {quiz.attachmentSize}
          </div>
        </div>
      </div>
      <Button variant="outline" size="sm" className="cursor-pointer">
        Download
      </Button>
    </div>
  );
}

// QuizDisplay - renders the assessment details
export function QuizDisplay({ quiz }: QuizDisplayProps) {
  return (
    <div className="flex h-full flex-col">
      {/* top actions */}
      <div className="flex items-center p-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" disabled={!quiz} title="Archive" className="cursor-pointer disabled:cursor-not-allowed">
            <IconArchive size={18} />
            <span className="sr-only">Archive</span>
          </Button>
          <Button variant="ghost" size="icon" disabled={!quiz} title="Move to junk" className="cursor-pointer disabled:cursor-not-allowed">
            <IconArchiveOff size={18} />
            <span className="sr-only">Move to junk</span>
          </Button>
          <Button variant="ghost" size="icon" disabled={!quiz} title="Move to trash" className="cursor-pointer disabled:cursor-not-allowed">
            <IconTrash size={18} />
            <span className="sr-only">Move to trash</span>
          </Button>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Button variant="ghost" size="icon" disabled={!quiz} title="Schedule" className="cursor-pointer disabled:cursor-not-allowed">
            <IconClock size={18} />
            <span className="sr-only">Schedule</span>
          </Button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" disabled={!quiz} title="Reply" className="cursor-pointer disabled:cursor-not-allowed">
            <IconCornerUpLeft size={18} />
            <span className="sr-only">Reply</span>
          </Button>
          <Button variant="ghost" size="icon" disabled={!quiz} title="Reply all" className="cursor-pointer disabled:cursor-not-allowed">
            <IconCornerUpRight size={18} />
            <span className="sr-only">Reply all</span>
          </Button>
          <Button variant="ghost" size="icon" disabled={!quiz} title="Forward" className="cursor-pointer disabled:cursor-not-allowed">
            <IconArrowForward size={18} />
            <span className="sr-only">Forward</span>
          </Button>
        </div>
        <Separator orientation="vertical" className="mx-2 h-6" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={!quiz} className="cursor-pointer disabled:cursor-not-allowed">
              <IconDotsVertical size={18} />
              <span className="sr-only">More</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="cursor-pointer">View instructions</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">Open details</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">Check schedule</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">Save for later</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Separator />
      {quiz ? (
        <div className="flex flex-1 flex-col">
          {/* assessment header */}
          <div className="flex items-start justify-between gap-4 p-4">
            <div className="flex items-center gap-4 text-sm">
              <Avatar className="cursor-pointer">
                <AvatarImage alt={quiz.educatorName} />
                <AvatarFallback>
                  {quiz.educatorName
                    .split(" ")
                    .map((chunk) => chunk[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col justify-center gap-1">
                <div className="font-semibold">{quiz.educatorName}</div>
                <Badge variant="outline" className="w-fit">{quiz.educatorUserType}</Badge>
              </div>
            </div>
            <ScheduleInfo quiz={quiz} />
          </div>
          <Separator />
          {/* assessment body */}
          <div className="flex-1 p-4 text-sm whitespace-pre-wrap">
            <div className="mb-2 space-y-2 whitespace-normal">
              <div className="text-base font-semibold">{quiz.subjectName}</div>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="outline">{quiz.sectionName}</Badge>
                <Badge className="rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-blue-500">
                  {quiz.moduleCode}
                </Badge>
                <Badge variant="outline">{quiz.termName}</Badge>
                <Badge className={quiz.statusLabel === "finished"
                  ? "rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500"
                  : "rounded-md border-0 bg-yellow-500/10 px-2.5 py-0.5 text-yellow-500"}>
                  {quiz.statusLabel}
                </Badge>
              </div>
            </div>
            {quiz.text}
            <div className="mt-6 space-y-2 whitespace-normal">
              <Separator />
              <div className="mt-6 text-sm font-semibold">Study Materials</div>
              <AttachmentCard quiz={quiz} />
            </div>
          </div>
          <Separator className="mt-auto" />
          {/* assessment action */}
          <div className="flex justify-end p-4">
            <Button className="cursor-pointer">Take Assessment</Button>
          </div>
        </div>
      ) : (
        <div className="text-muted-foreground p-8 text-center">No enrolled assessments found.</div>
      )}
    </div>
  );
}
