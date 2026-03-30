'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  IconChecklist,
  IconListLetters,
  IconStack2,
  IconTargetArrow,
} from '@tabler/icons-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { createQuiz, deleteQuiz, fetchQuizzes, type QuizRecord, updateQuiz } from '@/lib/supabase/quizzes'

import type { Quiz } from '../data/schema'
import { quizSchema } from '../data/schema'
import { getColumns } from './columns'
import { DataTable } from './data-table'

// QuizzesPageClient - manage local quiz rows
export function QuizzesPageClient() {
  // ==================== STATE ====================
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // loadQuizzes - fetch quiz rows from Supabase
  const loadQuizzes = async () => {
    try {
      setLoading(true)
      setError(null)
      const quizList = await fetchQuizzes()
      setQuizzes(quizSchema.array().parse(quizList))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load quizzes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuizzes()
  }, [])

  // handleAddQuiz - add one quiz row
  const handleAddQuiz = async (quiz: Quiz) => {
    const createdQuiz = await createQuiz(quiz as QuizRecord)
    const parsedQuiz = quizSchema.parse(createdQuiz)
    setQuizzes((prev) => [parsedQuiz, ...prev])
  }

  // handleDeleteQuiz - remove one quiz row
  const handleDeleteQuiz = async (quizId: number) => {
    await deleteQuiz(quizId)
    setQuizzes((prev) => prev.filter((quiz) => quiz.id !== quizId))
  }

  // handleUpdateQuiz - replace one quiz row
  const handleUpdateQuiz = async (updatedQuiz: Quiz) => {
    const savedQuiz = await updateQuiz(updatedQuiz as QuizRecord)
    const parsedQuiz = quizSchema.parse(savedQuiz)
    setQuizzes((prev) => prev.map((quiz) => (quiz.id === parsedQuiz.id ? parsedQuiz : quiz)))
  }

  // ==================== STATS ====================
  const stats = useMemo(
    () => ({
      total: quizzes.length,
      multipleChoice: quizzes.filter((quiz) => quiz.quizType === 'multiple_choice').length,
      identification: quizzes.filter((quiz) => quiz.quizType === 'identification').length,
      modulesCovered: new Set(quizzes.map((quiz) => quiz.moduleRowId)).size,
    }),
    [quizzes]
  )

  if (loading) {
    return (
      <div className="hidden h-full flex-1 flex-col space-y-6 px-4 md:flex md:px-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="hidden h-full flex-1 flex-col space-y-6 px-4 md:flex md:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Quiz Management</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="outline" className="cursor-pointer" onClick={loadQuizzes}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ==================== RENDER ====================
  return (
    <>
      <div className="flex flex-col gap-2 px-4 md:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Quizzes</h1>
        <p className="text-muted-foreground">
          Create quiz questions for modules using multiple choice and identification types.
        </p>
      </div>

      <div className="px-4 md:hidden md:px-6">
        <div className="flex h-96 items-center justify-center rounded-lg border bg-muted/20">
          <div className="p-8 text-center">
            <h3 className="mb-2 text-lg font-semibold">Quiz Management</h3>
            <p className="text-muted-foreground">
              Please use a larger screen to view the full quiz management interface.
            </p>
          </div>
        </div>
      </div>

      <div className="hidden h-full flex-1 flex-col space-y-6 px-4 md:flex md:px-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Quizzes</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stats.total}</span>
                    <span className="text-sm text-green-500">Ready</span>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <IconChecklist size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Multiple Choice</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stats.multipleChoice}</span>
                    <span className="text-sm text-blue-500">Choice</span>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <IconTargetArrow size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Identification</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stats.identification}</span>
                    <span className="text-sm text-yellow-500">Text</span>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <IconListLetters size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Modules Covered</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stats.modulesCovered}</span>
                    <span className="text-sm text-green-500">Linked</span>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <IconStack2 size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quiz Management</CardTitle>
            <CardDescription>
              View, filter, and create quizzes for the modules you already prepared.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={quizzes}
              columns={getColumns({
                onDeleteQuiz: handleDeleteQuiz,
                onUpdateQuiz: handleUpdateQuiz,
              })}
              onAddQuiz={handleAddQuiz}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
