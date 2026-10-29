import { useRef, useState } from 'react';
import { patterns, questionById, kindLabels } from './data/index.ts';
import { defaultFilters, filterQuestions, statistics } from './engine.ts';
import type { AppContextValue } from './app-context.tsx';
import { AppProvider } from './app-context.tsx';
import { AppShell } from './components/AppShell.tsx';
import type { Confirmation } from './components/index.ts';
import { useHashNavigation } from './hooks/use-hash-navigation.ts';
import { useLearningActions } from './hooks/use-learning-actions.ts';
import { useProgressStorage } from './hooks/use-progress-storage.ts';
import { useSystemTheme } from './hooks/use-system-theme.ts';
import type { Category, QuestionKind } from './types.ts';

export function App() {
  const { progress, setProgress, storageError, setLanguage, setTheme } = useProgressStorage();
  const { page, navigate } = useHashNavigation();
  useSystemTheme(progress.theme);

  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [filters, setFilters] = useState(defaultFilters);
  const [randomize, setRandomize] = useState(true);
  const [sessionSize, setSessionSize] = useState('20');
  const [practiceSetup, setPracticeSetup] = useState(false);
  const [search, setSearch] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);

  const active = progress.session;
  const actions = useLearningActions({
    active,
    setProgress,
    setConfirmation,
    setFilters,
    setPracticeSetup,
    navigate,
  });
  const stats = statistics(progress);
  const pool = filterQuestions(progress, filters);
  const q = active ? questionById[active.questionIds[active.index]] : null;
  const checked = !!q && !!active?.checked.includes(q.id);
  const selected = q ? active?.answers[q.id] : undefined;
  const sessionCorrect =
    active?.checked.filter((id) => active.answers[id] === questionById[id].patternId).length ?? 0;
  const filteredPatterns = patterns.filter((pattern) =>
    `${pattern.name} ${pattern.category}`.toLowerCase().includes(search.toLowerCase()),
  );

  const contextValue: AppContextValue = {
    page,
    practiceSetup,
    setPracticeSetup,
    progress,
    theme: progress.theme,
    setProgress,
    storageError,
    confirmation,
    setConfirmation,
    filters,
    setFilters,
    randomize,
    setRandomize,
    sessionSize,
    setSessionSize,
    search,
    setSearch,
    stats,
    active,
    pool,
    q,
    checked,
    selected,
    sessionCorrect,
    filteredPatterns,
    heading,
    navigate,
    setLanguage,
    setTheme,
    ...actions,
    categoryOptions: ['Creational', 'Structural', 'Behavioral'] as Category[],
    kindOptions: Object.keys(kindLabels) as QuestionKind[],
  };

  return (
    <AppProvider value={contextValue}>
      <AppShell />
    </AppProvider>
  );
}
