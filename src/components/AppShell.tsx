import { ConfirmDialog } from './ConfirmDialog.tsx';
import { Icon } from './Icon.tsx';
import { LanguageSwitch } from './LanguageSwitch.tsx';
import { useAppContext } from '../app-context.tsx';
import type { Page } from '../hooks/use-hash-navigation.ts';
import { DashboardScreen } from '../screens/dashboard.tsx';
import { PracticeScreen } from '../screens/practice.tsx';
import { ProgressScreen } from '../screens/progress.tsx';
import { SettingsScreen } from '../screens/settings.tsx';

const pageLabels: Record<Page, string> = {
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

export function AppShell() {
  const { page, progress, active, storageError, setLanguage, confirmation, setConfirmation } =
    useAppContext();

  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
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
          {(Object.keys(pageLabels) as Page[]).map((item) => (
            <a
              key={item}
              href={`#/${item}`}
              aria-label={pageLabels[item]}
              title={pageLabels[item]}
              className={`nav-link ${page === item ? 'active' : ''}`}
              aria-current={page === item ? 'page' : undefined}
            >
              <Icon name={pageIcons[item]} />
              <span className="nav-label">
                {item === 'progress' ? 'Progress' : pageLabels[item]}
              </span>
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
            Workspace <span className="slash">/</span> <strong>{pageLabels[page]}</strong>
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
  );
}
