import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { patterns, questionById, kindLabels } from './data/index.ts';
import {
  STORAGE_KEY,
  emptyProgress,
  parseProgress,
  statistics,
  createSession,
  filterQuestions,
  defaultFilters,
} from './engine.ts';
import type { Filters } from './engine.ts';
import type { Category, Language, Progress, QuestionKind, Session, Theme } from './types.ts';
import { ConfirmDialog, Icon, LanguageSwitch } from './components/index.ts';
import { DashboardScreen } from './screens/dashboard.tsx';
import { PracticeScreen } from './screens/practice.tsx';
import { ProgressScreen } from './screens/progress.tsx';
import { SettingsScreen } from './screens/settings.tsx';
import { AppProvider } from './app-context.tsx';
import type { Page } from './app-context.tsx';
import type { Confirmation } from './components/index.ts';

function currentPage(): Page {
  const page = location.hash.replace('#/', '');
  return ['dashboard', 'practice', 'progress', 'settings'].includes(page)
    ? (page as Page)
    : 'dashboard';
}
export function App() {
  const [initial] = useState(() => {
    try {
      return { progress: parseProgress(localStorage.getItem(STORAGE_KEY)), error: '' };
    } catch {
      return {
        progress: emptyProgress(),
        error:
          'Saved progress could not be loaded. A fresh session is available; browser storage may be unavailable or the saved data may be damaged.',
      };
    }
  });
  const [progress, setProgress] = useState<Progress>(initial.progress);
  const [storageError, setStorageError] = useState(initial.error);
  const theme = progress.theme;
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
  const resolvedTheme = theme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : theme;
  const [page, setPage] = useState<Page>(currentPage);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [randomize, setRandomize] = useState(true);
  const [sessionSize, setSessionSize] = useState('20');
  const [search, setSearch] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      setStorageError(
        'Progress cannot be saved in this browser. You can keep practicing, but changes may be lost when you close or refresh this page.',
      );
    }
  }, [progress]);
  useEffect(() => {
    const onHash = () => setPage(currentPage());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => {
    document.title = `${page[0].toUpperCase() + page.slice(1)} · Design Pattern Lab`;
  }, [page]);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-color-scheme: dark)');
    const onPreferenceChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);
    setSystemPrefersDark(preference.matches);
    preference.addEventListener('change', onPreferenceChange);
    return () => preference.removeEventListener('change', onPreferenceChange);
  }, []);
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);
  function navigate(next: Page) {
    location.hash = `/${next}`;
    setPage(next);
    window.scrollTo({ top: 0 });
  }
  function setLanguage(language: Language) {
    setProgress((p) => ({ ...p, language }));
  }
  function setTheme(nextTheme: Theme) {
    setProgress((p) => ({ ...p, theme: nextTheme }));
  }
  const stats = statistics(progress);
  const active = progress.session;
  const pool = filterQuestions(progress, filters);
  function begin(session: Session) {
    if (!session.questionIds.length) return;
    const run = () => {
      setProgress((p) => ({ ...p, session }));
      navigate('practice');
    };
    if (active && !active.finished) {
      setConfirmation({
        title: 'Start a new session?',
        body: 'This replaces your current session, including any unchecked selection. Checked answers and bookmarks stay in your learning history.',
        action: 'Start session',
        run,
      });
    } else run();
  }
  function focusPool(kind: Filters['pool']) {
    setFilters({ ...defaultFilters, pool: kind });
    navigate('dashboard');
    setTimeout(
      () => document.getElementById('practice-builder')?.scrollIntoView({ behavior: 'smooth' }),
      50,
    );
  }
  function toggleBookmark(id: string) {
    setProgress((p) => ({
      ...p,
      bookmarks: p.bookmarks.includes(id)
        ? p.bookmarks.filter((x) => x !== id)
        : [...p.bookmarks, id],
    }));
  }
  function restart() {
    if (!active) return;
    setConfirmation({
      title: 'Restart this session?',
      body: 'Answers in this session will be cleared. Your checked-answer history and bookmarks will stay saved.',
      action: 'Restart session',
      run: () => {
        const session = createSession(
          active.questionIds.map((id) => questionById[id]),
          active.title,
          active.questionIds.length,
          false,
        );
        session.options = active.options;
        setProgress((p) => ({ ...p, session }));
        navigate('practice');
      },
    });
  }
  const labels: Record<Page, string> = {
    dashboard: 'Overview',
    practice: 'Practice',
    progress: 'Your progress',
    settings: 'Settings',
  };
  const pageIcons: Record<Page, string> = {
    dashboard: 'grid',
    practice: 'book',
    progress: 'chart',
    settings: 'settings',
  };
  const sessionQuestion = active ? questionById[active.questionIds[active.index]] : null;
  const q = sessionQuestion;
  const checked = !!q && !!active?.checked.includes(q.id);
  const selected = q ? active?.answers[q.id] : undefined;
  const sessionCorrect =
    active?.checked.filter((id) => active.answers[id] === questionById[id].patternId).length ?? 0;
  const filteredPatterns = patterns.filter((p) =>
    `${p.name} ${p.category}`.toLowerCase().includes(search.toLowerCase()),
  );
  const contextValue = {
    page,
    progress,
    theme,
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
    begin,
    focusPool,
    toggleBookmark,
    restart,
    categoryOptions: ['Creational', 'Structural', 'Behavioral'] as Category[],
    kindOptions: Object.keys(kindLabels) as QuestionKind[],
  };
  return (
    <AppProvider value={contextValue}>
      <div className="app-shell">
        <a
          className="skip-link"
          href="#main"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('main')?.focus();
          }}
        >
          Skip to content
        </a>
        <aside className="sidebar">
          <a className="brand" href="#/dashboard" aria-label="Design Pattern Lab home">
            <span className="brand-mark">
              <Icon name="grid" size={24} />
            </span>
            <span>
              Pattern<span className="brand-light">lab</span>
              <small>DESIGN BETTER. EVERY DAY.</small>
            </span>
          </a>
          <div className="nav-caption">YOUR WORKSPACE</div>
          <nav aria-label="Main navigation">
            {(Object.keys(labels) as Page[]).map((item) => (
              <a
                key={item}
                href={`#/${item}`}
                aria-label={labels[item]}
                title={labels[item]}
                className={`nav-link ${page === item ? 'active' : ''}`}
                aria-current={page === item ? 'page' : undefined}
              >
                <Icon name={pageIcons[item]} />
                <span>{labels[item]}</span>
                {item === 'practice' && active && !active.finished && <span className="nav-dot" />}
              </a>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="little-book">
              <Icon name="book" />
              <strong>
                A little practice.
                <br />A better developer.
              </strong>
              <p>Learn the intent behind the code.</p>
              <a href="https://refactoring.guru/design-patterns" target="_blank" rel="noreferrer">
                Explore the reference <Icon name="external" size={13} />
              </a>
            </div>
            <div className="local-status">
              <span />
              {storageError ? 'Storage needs attention' : 'Saved on this browser'}
            </div>
          </div>
        </aside>
        <div className="main-shell">
          <header className="topbar">
            <span>
              Workspace <span className="slash">/</span> <strong>{labels[page]}</strong>
            </span>
            <div className="topbar-right">
              <span className="language-label">Code examples</span>
              <LanguageSwitch value={progress.language} onChange={setLanguage} />
              <span className="avatar" aria-hidden="true">
                PL
              </span>
            </div>
          </header>
          <main id="main" tabIndex={-1}>
            {storageError && (
              <div className="storage-warning" role="alert">
                {storageError}
              </div>
            )}
            {page === 'dashboard' && <DashboardScreen />}
            {page === 'practice' && <PracticeScreen />}
            {page === 'progress' && <ProgressScreen />}
            {page === 'settings' && <SettingsScreen />}
            <footer>
              <span>
                Patternlab <span className="footer-dot">·</span> A practice space for thoughtful
                developers.
              </span>
              <span>Learn the why. Build with intent.</span>
            </footer>
          </main>
        </div>
        {confirmation && (
          <ConfirmDialog confirmation={confirmation} onClose={() => setConfirmation(null)} />
        )}
      </div>
    </AppProvider>
  );
}
