import { PracticeSetup } from './practice-setup.tsx';
import { CodeBlock } from '../CodeBlock.tsx';
import { Icon, LanguageSwitch, Meter } from '../components/index.ts';
import { patternById, questionById, kindLabels } from '../data/index.ts';
import { canCheckAllAnswered, checkAllAnswered, chooseAnswer, checkAnswer } from '../engine.ts';
import { useAppContext } from '../app-context.tsx';

export function PracticeScreen() {
  const {
    active,
    practiceSetup,
    chooseSession,
    focusPool,
    q,
    checked,
    selected,
    sessionCorrect,
    progress,
    restart,
    cancelSession,
    toggleBookmark,
    setProgress,
    setLanguage,
    storageError,
    heading,
  } = useAppContext();
  const canCheckAll = canCheckAllAnswered(progress);
  const remainingCount =
    active?.questionIds.filter((id) => !active.checked.includes(id)).length ?? 0;
  return practiceSetup || !active || !q ? (
    <PracticeSetup />
  ) : active.finished ? (
    <>
      <div className="completion panel">
        <span className="completion-check">
          <Icon name="check" size={32} />
        </span>
        <p className="eyebrow">SESSION COMPLETE</p>
        <h1>Another step toward better design.</h1>
        <p>
          You checked {active.questionIds.length}{' '}
          {active.questionIds.length === 1 ? 'question' : 'questions'} in{' '}
          {active.title.toLowerCase()}.
        </p>
        <div className="result-score">
          {sessionCorrect}
          <span> / {active.questionIds.length}</span>
        </div>
        <p>
          correct answers · {Math.round((sessionCorrect / active.questionIds.length) * 100)}%
          accuracy this session
        </p>
        <div className="completion-actions">
          <button className="button primary" onClick={chooseSession}>
            Choose next session
            <Icon name="arrow" />
          </button>
          {active.questionIds.some((id) => active.answers[id] !== questionById[id].patternId) && (
            <button className="button secondary" onClick={() => focusPool('mistakes')}>
              Review mistakes
            </button>
          )}
          <button className="button secondary" onClick={restart}>
            Practice again
          </button>
        </div>
      </div>
      <section className="section">
        <h2>Session review</h2>
        <div className="review-list">
          {active.questionIds.map((id, i) => {
            const item = questionById[id];
            const correct = active.answers[id] === item.patternId;
            return (
              <div className="review-row" key={id}>
                <span className={`result-dot ${correct ? 'correct' : 'wrong'}`}>
                  {correct ? '✓' : '×'}
                </span>
                <div>
                  <small>
                    {i + 1} · {kindLabels[item.kind]}
                  </small>
                  <strong>{patternById[item.patternId].name}</strong>
                  <p>{item.explanation}</p>
                  <span className="muted small">
                    Your answer: {patternById[active.answers[id]].name}
                  </span>{' '}
                  ·{' '}
                  <a href={item.reference} target="_blank" rel="noreferrer">
                    Reference ↗
                  </a>
                </div>
                <button
                  className={`icon-button ${progress.bookmarks.includes(id) ? 'is-bookmarked' : ''}`}
                  aria-label={`${progress.bookmarks.includes(id) ? 'Remove' : 'Add'} bookmark for question ${i + 1}`}
                  aria-pressed={progress.bookmarks.includes(id)}
                  onClick={() => toggleBookmark(id)}
                >
                  <Icon name="bookmark" />
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </>
  ) : (
    <>
      <div className="practice-top">
        <div>
          <p className="eyebrow">{active.title}</p>
          <h1>One problem. A better approach.</h1>
        </div>
        <div className="practice-session-actions">
          <button className="text-button" onClick={restart}>
            <Icon name="reset" size={16} />
            Restart session
          </button>
          <button className="button danger-outline cancel-session-button" onClick={cancelSession}>
            Cancel session
          </button>
        </div>
      </div>
      <div className="session-progress">
        <div className="session-progress-header">
          <span>
            Question <strong>{active.index + 1}</strong> of {active.questionIds.length}
          </span>
          <div className="session-progress-summary">
            <span>
              {active.checked.length} checked · {sessionCorrect} correct
            </span>
            {canCheckAll && (
              <button
                className="button primary check-remaining-button"
                aria-label={`Check all ${remainingCount} remaining answers and finish the session`}
                onClick={() => setProgress((current) => checkAllAnswered(current))}
              >
                Check {remainingCount} remaining answers
                <Icon name="check" size={15} />
              </button>
            )}
          </div>
        </div>
        <Meter value={active.checked.length} total={active.questionIds.length} />
      </div>
      <div className="practice-layout">
        <section className="question-panel panel">
          <div className="question-meta">
            <div>
              <span className="tag">{kindLabels[q.kind]}</span>
              <span className="difficulty">{q.difficulty}</span>
            </div>
            <button
              className={`icon-button ${progress.bookmarks.includes(q.id) ? 'is-bookmarked' : ''}`}
              title="Bookmark this question"
              aria-label={
                progress.bookmarks.includes(q.id) ? 'Remove bookmark' : 'Bookmark this question'
              }
              aria-pressed={progress.bookmarks.includes(q.id)}
              onClick={() => toggleBookmark(q.id)}
            >
              <Icon name="bookmark" />
            </button>
          </div>
          <h2 ref={heading} tabIndex={-1} className="question-prompt">
            {q.prompt}
          </h2>
          {q.code && (
            <>
              <div className="code-language">
                <span className="small muted">Same question, your preferred language</span>
                <LanguageSwitch value={progress.language} onChange={setLanguage} />
              </div>
              <CodeBlock code={q.code[progress.language]} language={progress.language} />
            </>
          )}
          <fieldset className="answers" disabled={checked}>
            <legend>Choose the best-fitting pattern</legend>
            {active.options[q.id].map((id, i) => (
              <label
                className={`answer ${selected === id ? 'chosen' : ''} ${checked && id === q.patternId ? 'right' : ''} ${checked && selected === id && id !== q.patternId ? 'incorrect' : ''}`}
                key={id}
              >
                <input
                  type="radio"
                  name={q.id}
                  value={id}
                  checked={selected === id}
                  onChange={() => setProgress((p) => chooseAnswer(p, q.id, id))}
                />
                <span className="answer-letter">{'ABCD'[i]}</span>
                <span>{patternById[id].name}</span>
                {checked && id === q.patternId && <span className="answer-status">✓ Correct</span>}
                {checked && selected === id && id !== q.patternId && (
                  <span className="answer-status">× Your answer</span>
                )}
              </label>
            ))}
          </fieldset>
          {checked && (
            <div
              className={`explanation ${selected === q.patternId ? 'success' : 'retry'}`}
              role="status"
            >
              <h3>
                {selected === q.patternId
                  ? 'Exactly. Here’s why.'
                  : 'A useful distinction to remember.'}
              </h3>
              <p>
                <strong>{patternById[q.patternId].name}:</strong> {q.explanation}
              </p>
              <details>
                <summary>Why not the other patterns?</summary>
                {q.options
                  .filter((id) => id !== q.patternId)
                  .map((id) => (
                    <p key={id}>
                      <strong>{patternById[id].name}.</strong> {q.rationale[id]}
                    </p>
                  ))}
              </details>
              <a href={q.reference} target="_blank" rel="noreferrer">
                Read about {patternById[q.patternId].name}
                <Icon name="external" size={14} />
              </a>
            </div>
          )}
          <div className="question-actions">
            <button
              className="button secondary"
              disabled={active.index === 0}
              onClick={() => {
                setProgress((p) => ({
                  ...p,
                  session: { ...p.session!, index: active.index - 1 },
                }));
                heading.current?.focus();
              }}
            >
              Previous
            </button>
            {!checked ? (
              <button
                className="button primary"
                disabled={!selected}
                onClick={() => setProgress((p) => checkAnswer(p, q.id))}
              >
                Check answer
                <Icon name="check" size={17} />
              </button>
            ) : (
              <button
                className="button primary"
                onClick={() => {
                  const next =
                    active.index < active.questionIds.length - 1
                      ? active.index + 1
                      : active.questionIds.findIndex((id) => !active.checked.includes(id));
                  setProgress((p) => ({
                    ...p,
                    session: {
                      ...p.session!,
                      ...(next < 0 ? { finished: true } : { index: next }),
                    },
                  }));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  heading.current?.focus();
                }}
              >
                {active.checked.length === active.questionIds.length &&
                active.index === active.questionIds.length - 1
                  ? 'See results'
                  : active.index === active.questionIds.length - 1
                    ? 'Next unchecked'
                    : 'Next question'}
                <Icon name="arrow" size={17} />
              </button>
            )}
          </div>
        </section>
        <aside className="session-aside">
          <div className="panel question-map">
            <h3>Your session</h3>
            <p className="small muted">Move freely. Pick up where you left off.</p>
            <div className="question-dots">
              {active.questionIds.map((id, index) => {
                const checkedQuestion = active.checked.includes(id);
                const hasPendingAnswer = !!active.answers[id] && !checkedQuestion;
                const bookmarked = progress.bookmarks.includes(id);
                const status = checkedQuestion
                  ? active.answers[id] === questionById[id].patternId
                    ? 'correct'
                    : 'incorrect, revisit'
                  : hasPendingAnswer
                    ? 'answered, not checked'
                    : 'unchecked';
                return (
                  <button
                    key={id}
                    aria-label={`Question ${index + 1}, ${status}${bookmarked ? ', bookmarked' : ''}`}
                    aria-current={index === active.index ? 'step' : undefined}
                    className={`${index === active.index ? 'current' : ''} ${hasPendingAnswer ? 'has-pending-answer' : ''} ${bookmarked ? 'question-bookmarked' : ''} ${checkedQuestion ? (active.answers[id] === questionById[id].patternId ? 'done-right' : 'done-wrong') : ''}`}
                    onClick={() => {
                      setProgress((p) => ({ ...p, session: { ...p.session!, index } }));
                      heading.current?.focus();
                    }}
                  >
                    {index + 1}
                    {checkedQuestion && (
                      <span className="question-dot-status" aria-hidden="true">
                        {active.answers[id] === questionById[id].patternId ? '✓' : '×'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="map-legend">
              <span>○ Unchecked</span>
              <span className="answered-legend">◌ Answered</span>
              <span className="bookmarked-legend">
                <i aria-hidden="true" /> Marked
              </span>
              <span>✓ Correct</span>
              <span>× Revisit</span>
            </div>
          </div>
          <button className="button secondary" onClick={chooseSession}>
            Choose another session
          </button>
          <div className="study-tip">
            <Icon name="target" />
            <h3>Look for the intent.</h3>
            <p>
              Several patterns can look alike. Focus on the problem being solved and the constraints
              that matter.
            </p>
          </div>
          <p className="small muted save-note">
            <Icon name="check" size={14} />
            {storageError
              ? 'Browser storage is unavailable.'
              : 'Your selection is saved automatically.'}
          </p>
        </aside>
      </div>
    </>
  );
}
