import { useState } from 'react';
import { Icon, SectionHeading } from '../components/index.ts';
import { patternById, questionById } from '../data/index.ts';
import { clearSessionHistory, deleteSessionRecord } from '../engine.ts';
import { useAppContext } from '../app-context.tsx';

export function SessionHistory() {
  const { progress, setProgress, setConfirmation } = useAppContext();
  const [showAll, setShowAll] = useState(false);
  const records = [...progress.history].reverse();
  const visible = showAll ? records : records.slice(0, 5);
  return (
    <section className="section session-history" aria-label="Session history">
      <SectionHeading
        title="Session history"
        description="Read-only records of finished and interrupted sessions. Deleting a record keeps your learning statistics and bookmarks."
        aside={
          <button
            className="button danger-outline"
            disabled={!records.length}
            onClick={() =>
              setConfirmation({
                title: 'Delete all session history?',
                body: `Remove all ${records.length} saved session records? Your learning statistics, bookmarks, and current session stay saved.`,
                action: 'Delete all records',
                danger: true,
                run: () => setProgress(clearSessionHistory),
              })
            }
          >
            Delete all
          </button>
        }
      />
      {!records.length && (
        <p className="panel history-empty">
          No session records yet. Complete or end a session to save its record here.
        </p>
      )}
      <div className="history-list">
        {visible.map((record) => {
          const session = record.session;
          const checked = session.checked.length;
          return (
            <details className="panel history-record" key={session.id}>
              <summary>
                <span className="history-record-title">
                  <strong>{session.title}</strong>
                  <time dateTime={record.savedAt}>{new Date(record.savedAt).toLocaleString()}</time>
                </span>
                <span className="history-outcome">{record.outcome}</span>
                <span className="history-score">
                  <strong>
                    {checked ? `${record.correctCount} / ${checked} correct` : 'No scored answers'}
                  </strong>
                  <span>
                    {checked} of {session.questionIds.length} checked ·{' '}
                    {record.language === 'java' ? 'Java' : 'TypeScript'}
                  </span>
                </span>
              </summary>
              <div className="history-record-body">
                <div className="history-record-toolbar">
                  <p className="small muted">
                    <Icon name="clock" size={14} /> Saved snapshot ·{' '}
                    {checked
                      ? `${Math.round((record.correctCount / checked) * 100)}% accuracy on checked answers`
                      : 'No scored answers'}
                  </p>
                  <button
                    className="button danger-outline"
                    onClick={() =>
                      setConfirmation({
                        title: 'Delete this session record?',
                        body: `Remove the saved record for ${session.title}? Your learning statistics, bookmarks, and current session stay saved.`,
                        action: 'Delete record',
                        danger: true,
                        run: () =>
                          setProgress((current) => deleteSessionRecord(current, session.id)),
                      })
                    }
                  >
                    Delete record
                  </button>
                </div>
                <ol className="history-questions">
                  {session.questionIds.map((id) => {
                    const question = questionById[id];
                    const answer = session.answers[id];
                    const isChecked = session.checked.includes(id);
                    return (
                      <li key={id}>
                        <p>{question.prompt}</p>
                        <span className="history-answer">
                          {answer
                            ? `Your answer: ${patternById[answer].name}`
                            : 'No answer selected'}{' '}
                          ·{' '}
                          {isChecked
                            ? answer === question.patternId
                              ? 'Correct'
                              : 'Incorrect'
                            : 'Not checked'}
                        </span>
                        {isChecked && (
                          <p className="small muted">
                            {patternById[question.patternId].name} — {question.explanation}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </div>
            </details>
          );
        })}
      </div>
      {records.length > 5 && (
        <button className="button secondary history-show-all" onClick={() => setShowAll(!showAll)}>
          {showAll ? 'Show latest 5' : `Show all ${records.length} sessions`}
        </button>
      )}
    </section>
  );
}
