import { Icon, Meter, PageHeader, SectionHeading, StatCard } from '../components/index.ts';
import { questions, kindLabels } from '../data/index.ts';
import { createSession, statistics } from '../engine.ts';
import type { QuestionKind } from '../types.ts';
import { useAppContext } from '../app-context.tsx';

export function ProgressScreen() {
  const { stats, progress, focusPool, search, setSearch, begin, filteredPatterns } =
    useAppContext();
  return (
    <>
      <PageHeader
        eyebrow="See what’s taking shape"
        title="Your learning, in perspective."
        description="Coverage shows what you’ve tried. Accuracy shows where to revisit."
      />
      <section className="stats-grid">
        <StatCard
          label="Coverage"
          value={`${Math.round((stats.studied / questions.length) * 100)}%`}
          icon="book"
          note={`${stats.studied} of ${questions.length} unique questions`}
        />
        <StatCard
          label="Answer accuracy"
          value={stats.accuracy === null ? '—' : `${stats.accuracy}%`}
          icon="target"
          note="All checked attempts, including retries"
        />
        <StatCard
          label="Review mistakes"
          value={String(stats.mistakes)}
          icon="reset"
          note="Based on your latest answers"
          onClick={() => focusPool('mistakes')}
        />
        <StatCard
          label="Saved for later"
          value={String(progress.bookmarks.length)}
          icon="bookmark"
          note="Your bookmarked questions"
          onClick={() => focusPool('bookmarks')}
        />
      </section>
      <div className="type-stats">
        {(Object.keys(kindLabels) as QuestionKind[]).map((kind) => {
          const s = statistics(
            progress,
            questions.filter((q) => q.kind === kind),
          );
          return (
            <div className="panel" key={kind}>
              <span className="muted small">{kindLabels[kind]}</span>
              <h3>
                {s.accuracy === null ? '—' : `${s.accuracy}%`}
                <small> accuracy</small>
              </h3>
              <Meter value={s.studied} total={s.total} />
              <p className="small muted">
                {s.studied} / {s.total} studied
              </p>
            </div>
          );
        })}
      </div>
      <section className="section">
        <SectionHeading
          title="The pattern collection"
          description="Six perspectives on each pattern. Keep connecting the dots."
          aside={
            <label className="search-label">
              <span className="sr-only">Search patterns</span>
              <input
                type="search"
                placeholder="Find a pattern…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          }
        />
        <div className="pattern-grid">
          {filteredPatterns.map((p) => {
            const s = statistics(
              progress,
              questions.filter((q) => q.patternId === p.id),
            );
            return (
              <article className="panel pattern-card" key={p.id}>
                <span className={`category ${p.category.toLowerCase()}`}>{p.category}</span>
                <h3>{p.name}</h3>
                <p>{p.intent}</p>
                <Meter value={s.studied} total={6} />
                <div className="pattern-stat">
                  <span>{s.studied}/6 studied</span>
                  <span>{s.accuracy === null ? 'Not started' : `${s.accuracy}% accuracy`}</span>
                </div>
                <div className="pattern-actions">
                  <button
                    className="text-button"
                    onClick={() =>
                      begin(
                        createSession(
                          questions.filter((q) => q.patternId === p.id),
                          `${p.name} practice`,
                          6,
                        ),
                      )
                    }
                  >
                    Practice
                    <Icon name="arrow" size={14} />
                  </button>
                  <a
                    href={`https://refactoring.guru/design-patterns/${p.id}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${p.name} reference`}
                  >
                    Reference ↗
                  </a>
                </div>
              </article>
            );
          })}
        </div>
        {!filteredPatterns.length && (
          <p className="empty-hint">No pattern matches “{search}”. Try another name.</p>
        )}
      </section>
    </>
  );
}
