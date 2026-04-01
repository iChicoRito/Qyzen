'use client'

import { useEffect, useState } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  createQuiz,
  createQuizzes,
  deleteQuizzesByModule,
  fetchQuizzes,
  type QuizRecord,
} from '@/lib/supabase/quizzes'

import type { Quiz, QuizGroup } from '../data/schema'
import { quizGroupSchema } from '../data/schema'
import { getColumns } from './columns'
import { DataTable } from './data-table'

// QuizzesPageClient - manage local quiz rows
export function QuizzesPageClient() {
  // ==================== STATE ====================
  const [quizzes, setQuizzes] = useState<QuizGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // loadQuizzes - fetch quiz rows from Supabase
  const loadQuizzes = async () => {
    try {
      setLoading(true)
      setError(null)
      const quizList = await fetchQuizzes()
      setQuizzes(quizGroupSchema.array().parse(quizList))
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
    await createQuiz(quiz as QuizRecord)
    await loadQuizzes()
  }

  // handleDeleteModuleQuizzes - remove all quiz rows under one module
  const handleDeleteModuleQuizzes = async (moduleRowId: number) => {
    await deleteQuizzesByModule(moduleRowId)
    setQuizzes((prev) => prev.filter((quiz) => quiz.moduleRowId !== moduleRowId))
  }

  // handleUploadQuizzes - save uploaded quiz rows then refresh the list
  const handleUploadQuizzes = async (uploadedQuizzes: Quiz[]) => {
    await createQuizzes(uploadedQuizzes as QuizRecord[])
    await loadQuizzes()
  }

  if (loading) {
    return (
      <div className="flex min-w-0 flex-1 flex-col space-y-6 px-4 md:px-6">
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
      <div className="flex min-w-0 flex-1 flex-col space-y-6 px-4 md:px-6">
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
      <div className="flex min-w-0 flex-1 flex-col space-y-6 px-4 md:px-6">
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
                onDeleteModuleQuizzes: handleDeleteModuleQuizzes,
              })}
              onAddQuiz={handleAddQuiz}
              onUploadQuizzes={handleUploadQuizzes}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
