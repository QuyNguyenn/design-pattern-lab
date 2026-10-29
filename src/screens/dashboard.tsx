import { Icon, ModeCard, PageHeader, SectionHeading, StatCard } from '../components/index.ts';
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
      <PageHeader
        eyebrow="Interactive design-pattern practice"
        title="Learn patterns by solving problems."
        description="Read a scenario or code sample, choose the best-fit pattern, then learn why it fits."
        aside={<span className="edition">22 PATTERNS · 132 QUESTIONS</span>}
      />
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-pill">
            <span /> START HERE
          </span>
          <h2>Start with a quick practice.</h2>
          <p>
            Answer 10 mixed questions. Explore all 22 patterns, with Java and TypeScript code
            examples and a reference after every answer.
          </p>
          <button
            className="button lime"
            onClick={() =>
              active && !active.finished
                ? navigate('practice')
                : begin(createSession(questions, 'Quick practice', 10))
            }
          >
            {active && !active.finished ? 'Continue your session' : 'Start 10-question practice'}
            <Icon name="arrow" size={18} />
          </button>
          <small>
            {active && !active.finished
              ? `${active.checked.length} of ${active.questionIds.length} checked · ${active.title}`
              : 'No account needed · Progress saves in this browser'}
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
      <section className="how-it-works" aria-label="How it works">
        <SectionHeading
          title="How it works"
          description="A simple loop takes you from recognition to understanding."
        />
        <ol className="how-steps">
          <li className="how-step">
            <span className="step-number" aria-hidden="true">
              1
            </span>
            <div>
              <h3>Choose a session</h3>
              <p>Try 10 mixed questions, study 20, or create a focused set.</p>
            </div>
          </li>
          <li className="how-step">
            <span className="step-number" aria-hidden="true">
              2
            </span>
            <div>
              <h3>Pick the pattern</h3>
              <p>Read a scenario or inspect code, then choose the best fit.</p>
            </div>
          </li>
          <li className="how-step">
            <span className="step-number" aria-hidden="true">
              3
            </span>
            <div>
              <h3>Review the reasoning</h3>
              <p>Compare alternatives and open the pattern reference.</p>
            </div>
          </li>
        </ol>
      </section>
      <section className="stats-grid" aria-label="Learning summary">
        <StatCard
          label="Questions studied"
          value={`${stats.studied}`}
          suffix={`/ ${stats.total}`}
          icon="book"
          note="Unique questions checked"
        />
        <StatCard
          label="Answer accuracy"
          value={stats.accuracy === null ? '—' : `${stats.accuracy}%`}
          icon="target"
          note={
            stats.attempts
              ? `Across ${stats.attempts} checked attempts`
              : 'Your first answer starts the story'
          }
        />
        <StatCard
          label="Ready to revisit"
          value={`${stats.mistakes}`}
          icon="reset"
          note="Latest answer was incorrect"
          onClick={() => focusPool('mistakes')}
        />
        <StatCard
          label="Bookmarked"
          value={`${progress.bookmarks.length}`}
          icon="bookmark"
          note="Keep the tricky ones close"
          onClick={() => focusPool('bookmarks')}
        />
      </section>
      <section className="section">
        <SectionHeading
          title="Make practice your own"
          description="Pick a pace. Build a little confidence."
          aside={<span className="muted small">Progress saves automatically</span>}
        />
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
        <SectionHeading
          eyebrow="Your focus, your rules"
          title="Focused practice"
          description="Spend more time on what matters to you."
          aside={<span className="count-pill">{pool.length} matching questions</span>}
        />
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
