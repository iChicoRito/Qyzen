import { Quiz } from "./components/quiz";
import { quizzes } from "./data";

// QuizPage - renders the quiz assessment prototype
export default function QuizPage() {
  return <Quiz quizzes={quizzes} />;
}
