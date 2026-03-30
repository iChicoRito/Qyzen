"use client"

import { useEffect } from "react"

import {
  IconSearch,
} from "@tabler/icons-react"

import { Input } from "@/components/ui/input"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
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

// Quiz - renders the quiz assessment layout
export function Quiz({
  quizzes,
  defaultLayout = [42, 58],
}: QuizProps) {
  // selected assessment state
  const [quiz, setQuiz] = useQuiz();

  // ==================== SYNC SELECTED QUIZ ====================
  useEffect(() => {
    if (quizzes.length === 0) {
      setQuiz({ selected: null })
      return
    }

    if (!quiz.selected || !quizzes.some((item) => item.id === quiz.selected)) {
      setQuiz({ selected: quizzes[0].id })
    }
  }, [quiz.selected, quizzes, setQuiz])

  return (
    <TooltipProvider delayDuration={0}>
      {/* quiz layout */}
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={(sizes: number[]) => {
          document.cookie = `react-resizable-panels:layout:quiz=${JSON.stringify(sizes)}`;
        }}
        className="h-full items-stretch rounded-lg border overflow-hidden"
      >
        <ResizablePanel defaultSize={defaultLayout[0]} minSize={30}>
          <Tabs defaultValue="all" className="gap-1">
            <div className="flex items-center px-4 py-1.5">
              <h1 className="text-foreground text-xl font-bold">Assessments</h1>
              <TabsList className="ml-auto">
                <TabsTrigger value="all" className="cursor-pointer">Pending</TabsTrigger>
                <TabsTrigger value="unread" className="cursor-pointer">Finished</TabsTrigger>
              </TabsList>
            </div>
            <Separator />
            <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 p-4 backdrop-blur">
              <form>
                <div className="relative">
                  <IconSearch size={18} className="text-muted-foreground absolute top-2.5 left-2 cursor-pointer" />
                  <Input placeholder="Search" className="pl-8 cursor-text" />
                </div>
              </form>
            </div>
            <TabsContent value="all" className="m-0">
              <QuizList items={quizzes.filter((item) => item.labels.includes("pending"))} />
            </TabsContent>
            <TabsContent value="unread" className="m-0">
              <QuizList items={quizzes.filter((item) => item.labels.includes("finished"))} />
            </TabsContent>
          </Tabs>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
          <QuizDisplay quiz={quizzes.find((item) => item.id === quiz.selected) || null} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  );
}
