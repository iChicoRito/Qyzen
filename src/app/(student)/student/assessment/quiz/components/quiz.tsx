"use client"

import {
  IconSearch,
} from "@tabler/icons-react"

import { Input } from "@/components/ui/input"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QuizDisplay } from "./quiz-display"
import { QuizList } from "./quiz-list"
import { type Quiz } from "../data"
import { useQuiz } from "../use-quiz"

interface QuizProps {
  quizzes: Quiz[];
  defaultLayout?: number[];
}

// Quiz - renders the quiz assessment layout
export function Quiz({
  quizzes,
  defaultLayout = [42, 58],
}: QuizProps) {
  // selected assessment state
  const [quiz] = useQuiz();

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
