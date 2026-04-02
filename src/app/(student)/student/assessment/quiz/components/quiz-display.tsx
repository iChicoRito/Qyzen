"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconAlertCircle,
  IconCheck,
  IconDotsVertical,
  IconFileTypePpt,
  IconLock,
  IconLoader2 as Loader2,
  IconPencilCheck,
} from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import type { StudentAssessmentRecord } from "@/lib/supabase/student-assessments";

interface QuizDisplayProps {
  quiz: StudentAssessmentRecord | null;
  isMobile?: boolean;
}

// ScheduleInfo - renders the assessment schedule details
function ScheduleInfo({ quiz }: { quiz: StudentAssessmentRecord }) {
  return (
    <div className="text-muted-foreground break-words text-xs">{quiz.schedule}</div>
  );
}

// AttachmentCard - renders the fake study material file
function AttachmentCard({ quiz }: { quiz: StudentAssessmentRecord }) {
  return (
    <div className="bg-card flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="rounded-md bg-rose-500/10 p-2 text-rose-500">
          <IconFileTypePpt size={20} />
        </div>
        <div className="min-w-0 space-y-1">
          <div className="text-sm font-medium break-words">{quiz.attachmentName}</div>
          <div className="text-muted-foreground break-words text-xs">
            {quiz.attachmentLabel} - {quiz.attachmentSize}
          </div>
        </div>
      </div>
      <Button variant="outline" size="sm" className="w-full cursor-pointer sm:w-auto">
        Download
      </Button>
    </div>
  );
}

// DetailInfoCard - renders one assessment detail card
function DetailInfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border px-4 py-3">
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-muted-foreground mt-1 text-sm whitespace-normal">{value}</div>
    </div>
  );
}

// StatusBadge - renders the assessment status
function StatusBadge({ quiz }: { quiz: StudentAssessmentRecord }) {
  return (
    <Badge className={quiz.statusLabel === "finished"
      ? "rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500"
      : "rounded-md border-0 bg-yellow-500/10 px-2.5 py-0.5 text-yellow-500"}>
      {quiz.statusLabel}
    </Badge>
  );
}

// TakeAssessmentDialog - renders the entry confirmation dialog
function TakeAssessmentDialog({
  open,
  onOpenChange,
  quiz,
  isTaking,
  onTakeAssessment,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quiz: StudentAssessmentRecord;
  isTaking: boolean;
  onTakeAssessment: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="rounded-[1rem] sm:max-w-[500px]">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
            <IconPencilCheck size={32} />
          </div>

          <DialogHeader className="items-center text-center sm:text-center">
            <DialogTitle className="text-center">Ready to start this assessment?</DialogTitle>
            <DialogDescription className="max-w-[34rem] text-center">
              Once you enter <span className="font-medium text-foreground">{quiz.subjectName}</span>, the timer will start and tab switching will count toward your warning attempts.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="grid w-full max-w-[26rem] grid-cols-2 gap-3">
            <Button type="button" variant="outline" className="h-10 w-full cursor-pointer" onClick={() => onOpenChange(false)} disabled={isTaking}>
              Not yet
            </Button>
            <Button type="button" className="h-10 w-full cursor-pointer" disabled={isTaking} onClick={onTakeAssessment}>
              {isTaking ? (
                <>
                  <Loader2 size={18} className="mr-0 animate-spin" />
                  Loading...
                </>
              ) : (
                "I’m ready"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// QuizDisplay - renders the assessment details
export function QuizDisplay({ quiz, isMobile = false }: QuizDisplayProps) {
  const router = useRouter();
  const [takeDialogOpen, setTakeDialogOpen] = useState(false);
  const [isTaking, setIsTaking] = useState(false);
  const [isViewingResult, setIsViewingResult] = useState(false);

  // handleTakeAssessment - enter assessment with loading state
  const handleTakeAssessment = () => {
    if (!quiz) {
      return;
    }

    setIsTaking(true);
    router.push(`/student/assessment/take-quiz?moduleId=${quiz.moduleRowId}`);
  };

  // handleViewResult - open submitted assessment result
  const handleViewResult = () => {
    if (!quiz?.scoreId) {
      return;
    }

    setIsViewingResult(true);
    router.push(`/student/assessment/take-quiz/result?scoreId=${quiz.scoreId}`);
  };

  return (
    <div className={isMobile ? "flex flex-col" : "flex h-full min-h-0 flex-col"}>
      <div className="flex items-center justify-end p-2">
        <Separator orientation="vertical" className="mr-2 h-6" />
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
        <div className={isMobile ? "flex flex-col" : "flex min-h-0 flex-1 flex-col"}>
          {/* assessment header */}
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-center gap-4 text-sm">
              <Avatar className="cursor-pointer">
                <AvatarImage alt={quiz.educatorName} />
                <AvatarFallback>
                  {quiz.educatorName
                    .split(" ")
                    .map((chunk) => chunk[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col justify-center gap-1">
                <div className="font-semibold break-words">{quiz.educatorName}</div>
                <Badge variant="outline" className="w-fit">{quiz.educatorUserType}</Badge>
              </div>
            </div>
            <div className="w-full sm:w-auto sm:text-right">
              <ScheduleInfo quiz={quiz} />
            </div>
          </div>
          <Separator />
          {/* assessment body */}
          <div className={isMobile ? "p-4 text-sm whitespace-pre-wrap" : "min-h-0 flex-1 overflow-y-auto p-4 pb-24 text-sm whitespace-pre-wrap"}>
            <div className="mb-4 space-y-3 whitespace-normal">
              <div className="text-base font-semibold break-words">{quiz.subjectName}</div>
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <div className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.16em]">
                      Section
                    </div>
                    <div className="mt-1 text-sm font-medium">{quiz.sectionName}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.16em]">
                      Academic Term
                    </div>
                    <div className="mt-1 text-sm font-medium">{quiz.termName}</div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge className="rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-blue-500">
                    {quiz.moduleCode}
                  </Badge>
                  <StatusBadge quiz={quiz} />
                  {!quiz.hasQuestions ? (
                    <Badge className="rounded-md border-0 bg-rose-500/10 px-2.5 py-0.5 text-rose-500">
                      no questions yet
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-3 whitespace-normal md:grid-cols-2">
              <DetailInfoCard label="Questions" value={`${quiz.questionCount}`} />
              <DetailInfoCard label="Quiz Type" value={quiz.quizTypeLabel} />
              <DetailInfoCard label="Time Limit" value={`${quiz.timeLimitMinutes} minutes`} />
              <DetailInfoCard label="Shuffle" value={quiz.isShuffle ? "Enabled" : "Disabled"} />
              <DetailInfoCard
                label="Retakes"
                value={quiz.allowRetake ? `${quiz.remainingRetakes} remaining of ${quiz.retakeCount}` : "Disabled"}
              />
              <DetailInfoCard
                label="Attempts Used"
                value={`${quiz.submittedAttemptCount}`}
              />
              <DetailInfoCard label="Schedule Start" value={`${quiz.startDate} ${quiz.startTime}`} />
              <DetailInfoCard label="Schedule End" value={`${quiz.endDate} ${quiz.endTime}`} />
            </div>

            <div className="mt-6">{quiz.text}</div>

            {!quiz.hasQuestions ? (
              <div className="mt-6 rounded-lg border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-500">
                <div className="flex items-center gap-2 font-medium">
                  <IconAlertCircle size={18} />
                  This module cannot be taken yet.
                </div>
                <div className="mt-2 text-sm">
                  The educator has not added quiz questions for this module yet.
                </div>
              </div>
            ) : null}

            {quiz.isFinished ? (
              <div className="mt-6 rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-500">
                <div className="flex items-center gap-2 font-medium">
                  <IconCheck size={18} />
                  This assessment already has a submitted result.
                </div>
                <div className="mt-2 text-sm">
                  {quiz.canRetake
                    ? `You can still retake this assessment. Remaining retakes: ${quiz.remainingRetakes}.`
                    : quiz.allowRetake
                      ? 'You have used all allowed retake attempts for this assessment.'
                      : 'Retakes are disabled for this assessment.'}
                </div>
              </div>
            ) : null}

            <div className="mt-6 space-y-2 whitespace-normal">
              <Separator />
              <div className="mt-6 text-sm font-semibold">Study Materials</div>
              <AttachmentCard quiz={quiz} />
            </div>
          </div>
          <Separator className={!isMobile ? "mt-auto" : undefined} />
          {/* assessment action */}
          <div className="bg-background/95 sticky bottom-0 flex flex-col gap-3 border-t p-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:flex-row sm:justify-end">
            {quiz.isFinished && quiz.scoreId ? (
              <Button variant="outline" className="w-full cursor-pointer sm:w-auto" disabled={isViewingResult} onClick={handleViewResult}>
                {isViewingResult ? (
                  <>
                    <Loader2 size={18} className="mr-0 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "View Result"
                )}
              </Button>
            ) : null}

            {!quiz.isFinished ? (
              <Button
                type="button"
                className="w-full cursor-pointer sm:w-auto"
                disabled={!quiz.canTake || isTaking}
                onClick={() => setTakeDialogOpen(true)}
              >
                {!quiz.hasQuestions ? (
                  <>
                    <IconLock size={18} className="mr-0" />
                    No Questions Yet
                  </>
                ) : quiz.submittedAttemptCount > 0 ? (
                  'Retake Assessment'
                ) : (
                  "Take Assessment"
                )}
              </Button>
            ) : null}

            {quiz.isFinished && quiz.canRetake ? (
              <Button
                type="button"
                className="w-full cursor-pointer sm:w-auto"
                disabled={!quiz.canTake || isTaking}
                onClick={() => setTakeDialogOpen(true)}
              >
                {isTaking ? (
                  <>
                    <Loader2 size={18} className="mr-0 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Retake Assessment'
                )}
              </Button>
            ) : null}
          </div>

          <TakeAssessmentDialog
            open={takeDialogOpen}
            onOpenChange={setTakeDialogOpen}
            quiz={quiz}
            isTaking={isTaking}
            onTakeAssessment={handleTakeAssessment}
          />
        </div>
      ) : (
        <div className="text-muted-foreground p-8 text-center">No enrolled assessments found.</div>
      )}
    </div>
  );
}
