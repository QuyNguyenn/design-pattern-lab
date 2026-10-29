import { Icon, PageHeader, SectionHeading } from '../components/index.ts';
import { questions } from '../data/index.ts';
import { createSession } from '../engine.ts';
import { useAppContext } from '../app-context.tsx';

export function DashboardScreen() {
  const { active, navigate, focusPool, begin, stats, progress, chooseSession, setPracticeSetup } =
    useAppContext();
  if (stats.studied === 0 && !active) {
    return (
      <section className="first-start" aria-labelledby="first-start-title">
        <span className="first-start-mark" aria-hidden="true">
          <Icon name="book" size={22} />
        </span>
        <p className="eyebrow">DESIGN PATTERN PRACTICE</p>
        <h1 id="first-start-title">Learn one pattern at a time.</h1>
        <p className="first-start-copy">
          Read a short problem, choose a pattern, and see why it fits.
        </p>
        <button
          className="button primary"
          onClick={() => begin(createSession(questions, 'Quick practice', 10))}
        >
          Start practicing <Icon name="arrow" size={18} />
        </button>
        <p className="first-start-foot">10 questions · Progress saves in this browser</p>
        <button className="first-start-browse" onClick={() => navigate('progress')}>
          Browse the pattern library
        </button>
      </section>
    );
  }
  return (
    <>
      <PageHeader
        eyebrow="FIELD NOTES · DESIGN PATTERNS"
        title="Your learning, at a glance."
        description="Pick up where you left off and find your next step."
        aside={<span className="edition">VOL. 01 · 22 PATTERNS</span>}
      />
      <section className="hero overview-hero">
        <div className="hero-copy">
          <span className="hero-pill">
            <span /> TODAY’S EXERCISE
          </span>
          <h2>{active && !active.finished ? 'Pick up your notes.' : 'One question at a time.'}</h2>
          <p>
            {active && !active.finished
              ? 'Your answers are waiting. Continue at your own pace.'
              : 'Ready for another step? Head to Practice to start a short session or choose a focus.'}
          </p>
          <button
            className="button lime"
            onClick={() => {
              if (active && !active.finished) {
                setPracticeSetup(false);
                navigate('practice');
              } else {
                chooseSession();
              }
            }}
          >
            {active && !active.finished ? 'Continue your session' : 'Choose a practice session'}
            <Icon name="arrow" size={18} />
          </button>
          <small>
            {active && !active.finished
              ? `${active.checked.length} of ${active.questionIds.length} checked · ${active.title}`
              : 'No account needed · Progress saves in this browser'}
          </small>
        </div>
      </section>
      <section className="how-it-works" aria-label="How it works">
        <SectionHeading
          title="Your notebook"
          description="A few markers help you decide what to study next."
        />
        <ol className="how-steps">
          <li>
            <button type="button" className="how-step" onClick={() => navigate('progress')}>
              <span className="step-number" aria-hidden="true">
                <Icon name="chart" size={15} />
              </span>
              <span className="how-step-copy">
                <span className="how-step-title">
                  {stats.studied} / {stats.total} studied
                </span>
                <span className="how-step-detail">Open your learning overview.</span>
              </span>
              <Icon name="arrow" size={14} />
            </button>
          </li>
          <li>
            <button
              type="button"
              className="how-step"
              disabled={stats.mistakes === 0}
              onClick={() => focusPool('mistakes')}
            >
              <span className="step-number" aria-hidden="true">
                <Icon name="reset" size={15} />
              </span>
              <span className="how-step-copy">
                <span className="how-step-title">
                  {stats.mistakes ? `${stats.mistakes} to revisit` : 'All caught up'}
                </span>
                <span className="how-step-detail">
                  {stats.mistakes
                    ? 'Review questions you missed.'
                    : 'No answers to revisit right now.'}
                </span>
              </span>
              {stats.mistakes > 0 && <Icon name="arrow" size={14} />}
            </button>
          </li>
          <li>
            <button
              type="button"
              className="how-step"
              disabled={progress.bookmarks.length === 0}
              onClick={() => focusPool('bookmarks')}
            >
              <span className="step-number" aria-hidden="true">
                <Icon name="bookmark" size={15} />
              </span>
              <span className="how-step-copy">
                <span className="how-step-title">{progress.bookmarks.length} saved notes</span>
                <span className="how-step-detail">
                  {progress.bookmarks.length
                    ? 'Return to questions you saved.'
                    : 'Bookmark a question to keep it here.'}
                </span>
              </span>
              {progress.bookmarks.length > 0 && <Icon name="arrow" size={14} />}
            </button>
          </li>
        </ol>
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
