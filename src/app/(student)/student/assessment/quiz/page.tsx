import { Quiz } from "./components/quiz"
import { quizzes } from "./data"

// QuizPage - renders the quiz assessment prototype
export default function QuizPage() {
  return (
    <div className="@container/main flex flex-1 flex-col">
      <div className="h-[calc(100vh-4rem)] px-4 md:px-6">
        <Quiz
          quizzes={quizzes}
          defaultLayout={[42, 58]}
        />
      </div>
    </div>
  )
}
