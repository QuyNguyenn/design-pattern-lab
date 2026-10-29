import { useEffect, useRef, useState } from 'react';
import { Icon, Meter, PageHeader, SectionHeading, StatCard } from '../components/index.ts';
import { patternById, questions, kindLabels } from '../data/index.ts';
import { createSession, statistics } from '../engine.ts';
import type { QuestionKind } from '../types.ts';
import { useAppContext } from '../app-context.tsx';

export function ProgressScreen() {
  const { stats, progress, focusPool, search, setSearch, begin, filteredPatterns } =
    useAppContext();
  const [category, setCategory] = useState('All');
  const [layout, setLayout] = useState<'grid' | 'list'>('list');
  const [compareId, setCompareId] = useState<string | null>(null);
  const compareDialog = useRef<HTMLDialogElement>(null);
  const comparedPattern = compareId ? patternById[compareId] : null;
  const visiblePatterns = filteredPatterns.filter(
    (pattern) => category === 'All' || pattern.category === category,
  );

  useEffect(() => {
    if (compareId) compareDialog.current?.showModal();
  }, [compareId]);
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
              <div className="type-accuracy">
                <span className="muted small">Answer accuracy</span>
                <strong>{s.accuracy === null ? '—' : `${s.accuracy}%`}</strong>
              </div>
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
        <div className="pattern-toolbar">
          <div className="pattern-filters" role="group" aria-label="Filter patterns by type">
            {['All', 'Creational', 'Structural', 'Behavioral'].map((type) => (
              <button
                key={type}
                className={`pattern-filter ${category === type ? 'selected' : ''}`}
                aria-pressed={category === type}
                onClick={() => setCategory(type)}
              >
                {type}
              </button>
            ))}
          </div>
          <div className="pattern-layout-toggle" role="group" aria-label="Pattern display">
            <button
              aria-pressed={layout === 'grid'}
              className={layout === 'grid' ? 'selected' : ''}
              onClick={() => setLayout('grid')}
            >
              Grid
            </button>
            <button
              aria-pressed={layout === 'list'}
              className={layout === 'list' ? 'selected' : ''}
              onClick={() => setLayout('list')}
            >
              List
            </button>
          </div>
        </div>
        <div className={`pattern-grid ${layout === 'list' ? 'list-view' : ''}`}>
          {visiblePatterns.map((p) => {
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
                  <button
                    className="text-button pattern-compare-trigger"
                    onClick={() => setCompareId(p.id)}
                    aria-haspopup="dialog"
                    aria-label={`Compare ${p.name} with similar patterns`}
                  >
                    Compare
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        {!visiblePatterns.length && (
          <p className="empty-hint">
            No {category === 'All' ? 'pattern' : `${category.toLowerCase()} pattern`} matches
            {search ? ` “${search}”` : ''}. Try another filter or search.
          </p>
        )}
      </section>
      <dialog
        ref={compareDialog}
        className="pattern-compare-dialog"
        aria-labelledby="pattern-compare-title"
        onClose={() => setCompareId(null)}
      >
        {comparedPattern && (
          <>
            <p className="eyebrow">PATTERN FIELD NOTES</p>
            <h2 id="pattern-compare-title">What sets {comparedPattern.name} apart?</h2>
            <div className="compare-target">
              <span>THE INTENT</span>
              <p>{comparedPattern.intent}</p>
            </div>
            <p className="compare-label">Compare the dividing line</p>
            <ol className="compare-list">
              {comparedPattern.alternatives.map((id, index) => (
                <li key={id}>
                  <strong>{patternById[id].name}</strong>
                  <span>{comparedPattern.contrasts[index]}</span>
                </li>
              ))}
            </ol>
            <div className="dialog-actions">
              <button
                className="button secondary"
                autoFocus
                onClick={() => compareDialog.current?.close()}
              >
                Close notes
              </button>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
