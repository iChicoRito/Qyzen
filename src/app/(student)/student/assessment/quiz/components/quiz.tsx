"use client"

import { useEffect, useMemo, useState } from "react"

import {
  IconFilter,
} from "@tabler/icons-react"

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import type { StudentAssessmentRecord } from "@/lib/supabase/student-assessments"
import { QuizDisplay } from "./quiz-display"
import { QuizList } from "./quiz-list"
import { useQuiz } from "../use-quiz"

interface QuizProps {
  quizzes: StudentAssessmentRecord[];
  defaultLayout?: number[];
}

// QuizTabsHeader - renders the page title and status tabs
function QuizTabsHeader() {
  return (
    <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
      <h1 className="text-foreground text-xl font-bold">Assessments</h1>
      <TabsList className="w-full sm:ml-auto sm:w-auto">
        <TabsTrigger value="pending" className="cursor-pointer flex-1 sm:flex-none">Pending</TabsTrigger>
        <TabsTrigger value="finished" className="cursor-pointer flex-1 sm:flex-none">Finished</TabsTrigger>
      </TabsList>
    </div>
  )
}

// QuizFilterBar - renders the module filter
function QuizFilterBar({
  moduleFilter,
  setModuleFilter,
  moduleOptions,
}: {
  moduleFilter: string;
  setModuleFilter: (value: string) => void;
  moduleOptions: string[];
}) {
  return (
    <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 p-4 backdrop-blur">
      <div className="relative">
        <IconFilter size={18} className="text-muted-foreground pointer-events-none absolute top-2.5 left-3" />
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-full pl-9">
            <SelectValue placeholder="Filter by module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            {moduleOptions.map((moduleCode) => (
              <SelectItem key={moduleCode} value={moduleCode}>
                {moduleCode}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

// Quiz - renders the quiz assessment layout
export function Quiz({
  quizzes,
  defaultLayout = [42, 58],
}: QuizProps) {
  // selected assessment state
  const [quiz, setQuiz] = useQuiz();
  const [moduleFilter, setModuleFilter] = useState("all");
  const moduleOptions = useMemo(
    () => [...new Set(quizzes.map((item) => item.moduleCode))],
    [quizzes]
  );
  const filteredQuizzes = useMemo(
    () => quizzes.filter((item) => moduleFilter === "all" || item.moduleCode === moduleFilter),
    [moduleFilter, quizzes]
  );
  const selectedQuiz = filteredQuizzes.find((item) => item.id === quiz.selected) || null;

  // ==================== SYNC SELECTED QUIZ ====================
  useEffect(() => {
    if (filteredQuizzes.length === 0) {
      setQuiz({ selected: null })
      return
    }

    if (!quiz.selected || !filteredQuizzes.some((item) => item.id === quiz.selected)) {
      setQuiz({ selected: filteredQuizzes[0].id })
    }
  }, [filteredQuizzes, quiz.selected, setQuiz])

  return (
    <TooltipProvider delayDuration={0}>
      <div className="md:hidden">
        {/* mobile layout */}
        <Tabs defaultValue="pending" className="flex flex-col gap-0 rounded-lg border">
          <QuizTabsHeader />
          <Separator />
          <QuizFilterBar
            moduleFilter={moduleFilter}
            setModuleFilter={setModuleFilter}
            moduleOptions={moduleOptions}
          />
          <Separator />
          <TabsContent value="pending" className="m-0 border-b">
            <QuizList items={filteredQuizzes.filter((item) => item.labels.includes("pending"))} isMobile />
          </TabsContent>
          <TabsContent value="finished" className="m-0 border-b">
            <QuizList items={filteredQuizzes.filter((item) => item.labels.includes("finished"))} isMobile />
          </TabsContent>
          <QuizDisplay quiz={selectedQuiz} isMobile />
        </Tabs>
      </div>

      <div className="hidden h-full md:block">
        {/* desktop layout */}
        <ResizablePanelGroup
          direction="horizontal"
          onLayout={(sizes: number[]) => {
            document.cookie = `react-resizable-panels:layout:quiz=${JSON.stringify(sizes)}`;
          }}
          className="h-full min-h-0 items-stretch overflow-hidden rounded-lg border"
        >
          <ResizablePanel defaultSize={defaultLayout[0]} minSize={30} className="min-h-0">
            <Tabs defaultValue="pending" className="gap-1">
              <QuizTabsHeader />
              <Separator />
              <QuizFilterBar
                moduleFilter={moduleFilter}
                setModuleFilter={setModuleFilter}
                moduleOptions={moduleOptions}
              />
              <TabsContent value="pending" className="m-0">
                <QuizList items={filteredQuizzes.filter((item) => item.labels.includes("pending"))} />
              </TabsContent>
              <TabsContent value="finished" className="m-0">
                <QuizList items={filteredQuizzes.filter((item) => item.labels.includes("finished"))} />
              </TabsContent>
            </Tabs>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={defaultLayout[1]} minSize={30} className="min-h-0">
            <QuizDisplay quiz={selectedQuiz} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </TooltipProvider>
  );
}
