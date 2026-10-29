import { createContext, useContext } from 'react';
import type { Dispatch, RefObject, SetStateAction } from 'react';
import type { Filters } from './engine.ts';
import type {
  Category,
  Language,
  Pattern,
  Progress,
  Question,
  QuestionKind,
  Session,
  Theme,
} from './types.ts';
import type { Confirmation } from './components/index.ts';
import type { statistics } from './engine.ts';

export type Page = 'dashboard' | 'practice' | 'progress' | 'settings';
export type LearningStats = ReturnType<typeof statistics>;

export interface AppContextValue {
  page: Page;
  progress: Progress;
  theme: Theme;
  setProgress: Dispatch<SetStateAction<Progress>>;
  storageError: string;
  confirmation: Confirmation | null;
  setConfirmation: Dispatch<SetStateAction<Confirmation | null>>;
  filters: Filters;
  setFilters: Dispatch<SetStateAction<Filters>>;
  randomize: boolean;
  setRandomize: Dispatch<SetStateAction<boolean>>;
  sessionSize: string;
  setSessionSize: Dispatch<SetStateAction<string>>;
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  stats: LearningStats;
  active: Session | null;
  pool: Question[];
  q: Question | null;
  checked: boolean;
  selected: string | undefined;
  sessionCorrect: number;
  filteredPatterns: Pattern[];
  heading: RefObject<HTMLHeadingElement | null>;
  navigate: (page: Page) => void;
  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
  begin: (session: Session) => void;
  focusPool: (pool: Filters['pool']) => void;
  toggleBookmark: (questionId: string) => void;
  restart: () => void;
  categoryOptions: Category[];
  kindOptions: QuestionKind[];
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({
  value,
  children,
}: {
  value: AppContextValue;
  children: React.ReactNode;
}) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('App screens must be rendered inside AppProvider.');
  return value;
}
