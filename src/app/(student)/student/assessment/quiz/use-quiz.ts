import { create } from "zustand";
import type { Quiz } from "./data";
import { quizzes } from "./data";

interface Config {
  selected: Quiz["id"] | null;
}

const useQuizStore = create<
  Config & { setState: (newState: Partial<Config>) => void }
>((set) => ({
  selected: quizzes[0].id,
  setState: (newState) => set((state) => ({ ...state, ...newState })),
}));

// useQuiz - manages the selected quiz state
export function useQuiz(): [Config, (newState: Partial<Config>) => void] {
  const selected = useQuizStore((state) => state.selected);
  const setState = useQuizStore((state) => state.setState);
  return [{ selected }, setState];
}
