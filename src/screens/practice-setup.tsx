import { Icon, ModeCard, PageHeader, SectionHeading } from '../components/index.ts';
import { patterns, questions, kindLabels } from '../data/index.ts';
import { createSession } from '../engine.ts';
import type { Filters } from '../engine.ts';
import type { Category } from '../types.ts';
import { useAppContext } from '../app-context.tsx';

export function PracticeSetup() {
  const {
    active,
    storageError,
    begin,
    progress,
    filters,
    setFilters,
    pool,
    randomize,
    setRandomize,
    sessionSize,
    setSessionSize,
    setPracticeSetup,
  } = useAppContext();
  return (
    <>
      <PageHeader
        eyebrow="PRACTICE"
        title="What will you work on today?"
        description="Start with a short mix, or choose a focus for your session."
      />
      {active && !active.finished && (
        <div className="practice-resume panel">
          <div>
            <strong>Your session is waiting</strong>
            <p className="small muted">
              {active.title} · {active.checked.length} of {active.questionIds.length} checked
            </p>
          </div>
          <button className="button secondary" onClick={() => setPracticeSetup(false)}>
            Continue session <Icon name="arrow" />
          </button>
        </div>
      )}
      <section className="practice-quick panel">
        <span className="eyebrow">A SMALL DAILY PRACTICE</span>
        <h2>Ten questions. One fresh perspective.</h2>
        <p>A mix of scenarios and code across all 22 patterns.</p>
        <button
          className="button primary"
          onClick={() => begin(createSession(questions, 'Quick practice', 10))}
        >
          Start quick practice <Icon name="arrow" />
        </button>
        <p className="small muted">
          10 questions ·{' '}
          {storageError
            ? 'Progress cannot be saved right now'
            : 'Your progress saves in this browser'}
        </p>
      </section>
      <details className="practice-disclosure panel">
        <summary>
          Explore other sessions <span>Study unseen questions or the full collection</span>
        </summary>
        <div className="practice-disclosure-body">
          <section className="section">
            <div className="mode-grid">
              <ModeCard
                icon="target"
                tone="orange"
                title="Study session"
                label="20 QUESTIONS"
                text="Go a little deeper, with questions you haven't tried first."
                action="Start studying"
                onClick={() => begin(createSession(questions, 'Study session', 20, true, progress))}
              />
              <ModeCard
                icon="book"
                tone="purple"
                title="Full practice"
                label="132 QUESTIONS"
                text="Work through the whole collection. Pause and return anytime."
                action="Explore all questions"
                onClick={() =>
                  begin(createSession(questions, 'Full practice', questions.length, false))
                }
              />
            </div>
          </section>
        </div>
      </details>
      <details
        className="builder panel practice-disclosure"
        id="practice-builder"
        open={filters.pool !== 'all' ? true : undefined}
      >
        <summary>
          Customize a session <span>Pool, pattern, question type, and length</span>
        </summary>
        <div className="practice-disclosure-body">
          <SectionHeading
            eyebrow="Your focus, your rules"
            title="Focused practice"
            description="Spend more time on what matters to you."
            aside={
              <span className="count-pill">
                {pool.length} matching {pool.length === 1 ? 'question' : 'questions'}
              </span>
            }
          />
          <div className="filter-grid">
            <label>
              Question pool
              <select
                value={filters.pool}
                onChange={(e) =>
                  setFilters({ ...filters, pool: e.target.value as Filters['pool'] })
                }
              >
                <option value="all">All questions</option>
                <option value="unseen">Not studied yet</option>
                <option value="mistakes">Review mistakes</option>
                <option value="bookmarks">Bookmarked</option>
              </select>
            </label>
            <label>
              Category
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    category: e.target.value as Filters['category'],
                    pattern: 'all',
                  })
                }
              >
                <option value="all">All categories</option>
                {(['Creational', 'Structural', 'Behavioral'] as Category[]).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Pattern
              <select
                value={filters.pattern}
                onChange={(e) => setFilters({ ...filters, pattern: e.target.value })}
              >
                <option value="all">All patterns</option>
                {patterns
                  .filter((p) => filters.category === 'all' || p.category === filters.category)
                  .map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Question type
              <select
                value={filters.kind}
                onChange={(e) =>
                  setFilters({ ...filters, kind: e.target.value as Filters['kind'] })
                }
              >
                <option value="all">All types</option>
                {Object.entries(kindLabels).map(([key, label]) => (
                  <option value={key} key={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="builder-bottom">
            <div className="builder-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={randomize}
                  onChange={(e) => setRandomize(e.target.checked)}
                />
                Shuffle questions & choices
              </label>
              <label className="inline-label">
                Session size
                <select
                  aria-label="Session size"
                  value={sessionSize}
                  onChange={(e) => setSessionSize(e.target.value)}
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="all">All matches</option>
                </select>
              </label>
            </div>
            <button
              className="button primary"
              disabled={!pool.length}
              onClick={() =>
                begin(
                  createSession(
                    pool,
                    'Focused practice',
                    sessionSize === 'all' ? pool.length : Number(sessionSize),
                    randomize,
                  ),
                )
              }
            >
              Start focused practice
              <Icon name="arrow" size={17} />
            </button>
          </div>
          {!pool.length && (
            <p className="empty-hint">
              No questions match yet. Try another filter, answer a few questions, or add a bookmark.
            </p>
          )}
        </div>
      </details>
    </>
  );
}
