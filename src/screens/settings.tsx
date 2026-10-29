import { Icon, LanguageSwitch, PageHeader } from '../components/index.ts';
import { emptyProgress, defaultFilters } from '../engine.ts';
import { useAppContext } from '../app-context.tsx';

export function SettingsScreen() {
  const {
    progress,
    theme,
    active,
    setLanguage,
    setTheme,
    restart,
    setConfirmation,
    setProgress,
    setFilters,
    navigate,
  } = useAppContext();
  return (
    <>
      <PageHeader
        eyebrow="Make yourself at home"
        title="A lab that works your way."
        description="Your preferences and progress stay in this browser."
      />
      <div className="settings-stack">
        <section className="panel settings-card">
          <div>
            <h2>Appearance</h2>
            <p>
              Choose a theme or follow your system setting. Your preference is saved in this
              browser.
            </p>
          </div>
          <div className="segmented theme-options" role="group" aria-label="Color theme">
            {(['light', 'dark', 'system'] as const).map((option) => (
              <button
                key={option}
                className={theme === option ? 'selected' : ''}
                aria-pressed={theme === option}
                onClick={() => setTheme(option)}
              >
                {option === 'system' ? 'System' : option === 'dark' ? 'Dark' : 'Light'}
              </button>
            ))}
          </div>
        </section>
        <section className="panel settings-card">
          <div>
            <h2>Code language</h2>
            <p>Used for all code examples. Switch anytime without changing your answers.</p>
          </div>
          <LanguageSwitch value={progress.language} onChange={setLanguage} />
        </section>
        <section className="panel settings-card">
          <div>
            <h2>Restart current session</h2>
            <p>
              Clear session answers and start the same set again. Keep your learning history and
              bookmarks.
            </p>
          </div>
          <button className="button secondary" disabled={!active} onClick={restart}>
            <Icon name="reset" size={17} />
            Restart session
          </button>
        </section>
        <section className="panel settings-card danger-zone">
          <div>
            <h2>Reset all progress</h2>
            <p>
              Remove all answers, session records, bookmarks, and preferences from this browser.
              This cannot be undone.
            </p>
          </div>
          <button
            className="button danger-outline"
            onClick={() =>
              setConfirmation({
                title: 'Reset all progress?',
                body: 'All checked answers, session records, bookmarks, your active session, and preferences will be removed from this browser. This cannot be undone.',
                action: 'Reset everything',
                danger: true,
                run: () => {
                  setProgress(emptyProgress());
                  setFilters(defaultFilters);
                  navigate('dashboard');
                },
              })
            }
          >
            Reset all progress
          </button>
        </section>
        <section className="panel about-card">
          <h2>About this lab</h2>
          <p>
            132 original questions across 22 design patterns, with Java and TypeScript code
            examples. Examples isolate the relevant collaboration; they are teaching snippets, not
            complete production implementations.
          </p>
          <p>
            Code examples target Java 17+ and modern TypeScript. Each code question has equivalent
            examples in both languages and counts as one question.
          </p>
          <p>
            Progress uses local storage. It is specific to this browser and site address; clearing
            browser data removes it. No account or server is required.
          </p>
          <p>
            Learning references:{' '}
            <a href="https://refactoring.guru/design-patterns" target="_blank" rel="noreferrer">
              Refactoring.Guru ↗
            </a>
            . This independent project is not affiliated with Refactoring.Guru.
          </p>
        </section>
      </div>
    </>
  );
}
