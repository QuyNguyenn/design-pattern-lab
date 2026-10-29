import { Icon, Stat, ModeCard } from '../components/ui.tsx';
import { patterns, questions, kindLabels } from '../data/index.ts';
import { createSession } from '../engine.ts';
import type { Filters } from '../engine.ts';
import type { Category } from '../types.ts';
import { useAppContext } from '../app-context.tsx';

export function DashboardScreen() {
  const {
    active,
    navigate,
    begin,
    stats,
    progress,
    focusPool,
    filters,
    setFilters,
    pool,
    randomize,
    setRandomize,
    sessionSize,
    setSessionSize,
  } = useAppContext();
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR DAILY DOSE OF BETTER DESIGN</p>
          <h1>Small sessions. Lasting understanding.</h1>
          <p>Go beyond the names. Learn when, why, and how to use design patterns.</p>
        </div>
        <span className="edition">22 PATTERNS · 132 QUESTIONS</span>
      </div>
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-pill">
            <span /> LEARN BY SOLVING
          </span>
          <h2>
            Recognize the problem.
            <br />
            <em>Find the pattern.</em>
          </h2>
          <p>
            Real-world scenarios. Code you can read.
            <br />
            Clear explanations that make it click.
          </p>
          <button
            className="button lime"
            onClick={() =>
              active && !active.finished
                ? navigate('practice')
                : begin(createSession(questions, 'Quick practice', 10))
            }
          >
            {active && !active.finished ? 'Continue learning' : 'Start a quick practice'}
            <Icon name="arrow" size={18} />
          </button>
          <small>
            {active && !active.finished
              ? `${active.checked.length} of ${active.questionIds.length} checked · ${active.title}`
              : '10 questions · A small step forward'}
          </small>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="art-node top-node">{'{ }'}</div>
          <div className="art-node left-node">◇</div>
          <div className="art-node bottom-node">↗</div>
          <div className="art-code">
            <div>
              <i />
              <i />
              <i />
            </div>
            <span className="art-comment">// a better way to build</span>
            <p>
              <b>problem</b>.understand();
            </p>
            <p>
              <b>pattern</b>.recognize();
            </p>
            <p>
              <b>knowledge</b>.apply();
            </p>
            <span className="art-tag">LESS GUESSWORK. MORE INTENT.</span>
          </div>
        </div>
      </section>
      <section className="stats-grid" aria-label="Learning summary">
        <Stat
          label="Questions studied"
          value={`${stats.studied}`}
          suffix={`/ ${stats.total}`}
          icon="book"
          note="Unique questions checked"
        />
        <Stat
          label="Answer accuracy"
          value={stats.accuracy === null ? '—' : `${stats.accuracy}%`}
          icon="target"
          note={
            stats.attempts
              ? `Across ${stats.attempts} checked attempts`
              : 'Your first answer starts the story'
          }
        />
        <Stat
          label="Ready to revisit"
          value={`${stats.mistakes}`}
          icon="reset"
          note="Latest answer was incorrect"
          onClick={() => focusPool('mistakes')}
        />
        <Stat
          label="Bookmarked"
          value={`${progress.bookmarks.length}`}
          icon="bookmark"
          note="Keep the tricky ones close"
          onClick={() => focusPool('bookmarks')}
        />
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Make practice your own</h2>
            <p>Pick a pace. Build a little confidence.</p>
          </div>
          <span className="muted small">Progress saves automatically</span>
        </div>
        <div className="mode-grid">
          <ModeCard
            icon="shuffle"
            tone="green"
            title="Quick practice"
            label="10 QUESTIONS"
            text="A fresh mix of scenarios and code. Perfect for a short break."
            action="Let's practice"
            onClick={() => begin(createSession(questions, 'Quick practice', 10))}
          />
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
      <section className="builder panel" id="practice-builder">
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR FOCUS, YOUR RULES</p>
            <h2>Focused practice</h2>
            <p>Spend more time on what matters to you.</p>
          </div>
          <span className="count-pill">{pool.length} matching questions</span>
        </div>
        <div className="filter-grid">
          <label>
            Question pool
            <select
              value={filters.pool}
              onChange={(e) => setFilters({ ...filters, pool: e.target.value as Filters['pool'] })}
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
              onChange={(e) => setFilters({ ...filters, kind: e.target.value as Filters['kind'] })}
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
      </section>
      <div className="reference-note">
        <Icon name="book" size={18} />
        <p>
          Built around the 22 patterns in the{' '}
          <a
            href="https://refactoring.guru/design-patterns/catalog"
            target="_blank"
            rel="noreferrer"
          >
            Refactoring.Guru catalog ↗
          </a>
          . Original practice questions, with a reference after every answer.
        </p>
      </div>
    </>
  );
}
