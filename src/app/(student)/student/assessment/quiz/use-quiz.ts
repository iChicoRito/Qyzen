import { create } from "zustand";

interface Config {
  selected: string | null;
}

const useQuizStore = create<
  Config & { setState: (newState: Partial<Config>) => void }
>((set) => ({
  selected: null,
  setState: (newState) => set((state) => ({ ...state, ...newState })),
}));

// useQuiz - manages the selected quiz state
export function useQuiz(): [Config, (newState: Partial<Config>) => void] {
  const selected = useQuizStore((state) => state.selected);
  const setState = useQuizStore((state) => state.setState);
  return [{ selected }, setState];
}
