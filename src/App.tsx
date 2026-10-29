import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { patterns, patternById, questions, questionById, kindLabels } from './data/index.ts';
import { STORAGE_KEY, emptyProgress, parseProgress, statistics, createSession, chooseAnswer, checkAnswer, filterQuestions, defaultFilters } from './engine.ts';
import type { Filters } from './engine.ts';
import type { Category, Language, Progress, QuestionKind, Session } from './types.ts';
import { CodeBlock } from './CodeBlock.tsx';

type Page = 'dashboard' | 'practice' | 'progress' | 'settings';
function currentPage(): Page {
  const page = location.hash.replace('#/', '');
  return ['dashboard', 'practice', 'progress', 'settings'].includes(page) ? page as Page : 'dashboard';
}
function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    book: <><path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Z" /><path d="M12 5v15" /></>,
    chart: <><path d="M4 3v17h17M9 16v-5M14 16V7M19 16V3" /></>,
    settings: <><path d="M4 7h16M4 17h16" /><circle cx="9" cy="7" r="3" /><circle cx="16" cy="17" r="3" /></>,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    shuffle: <><path d="m3 5 3 0c5 0 7 14 12 14h3m-4-4 4 4-4 3M3 19h3c2 0 3-3 4-5M14 9c1-3 2-4 4-4h3m-4-3 4 3-4 4" /></>,
    bookmark: <path d="M6 3h12v18l-6-4-6 4V3Z" />,
    check: <path d="m5 12 4 4L19 6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    code: <><path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18" /></>,
    reset: <><path d="M4 8a8 8 0 1 1-1 7M4 3v5h5" /></>,
    target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
    external: <><path d="M14 3h7v7m0-7L10 14M10 3H4v17h17v-6" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.grid}</svg>;
}
function LanguageSwitch({ value, onChange }: { value: Language; onChange: (language: Language) => void }) {
  return <div className="segmented" role="group" aria-label="Code language">
    {(['typescript', 'java'] as const).map(lang => <button key={lang} aria-pressed={value === lang} className={value === lang ? 'selected' : ''} onClick={() => onChange(lang)}>{lang === 'java' ? 'Java' : 'TypeScript'}</button>)}
  </div>;
}
function Meter({ value, total }: { value: number; total: number }) {
  return <div className="meter" role="progressbar" aria-label="Questions studied" aria-valuemin={0} aria-valuemax={total} aria-valuenow={value}><span style={{ width: `${total ? value / total * 100 : 0}%` }} /></div>;
}
interface Confirmation { title: string; body: string; action: string; run: () => void; danger?: boolean }
function ConfirmDialog({ confirmation, onClose }: { confirmation: Confirmation; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.showModal();
    return () => { ref.current?.close(); previous?.focus(); };
  }, []);
  return <dialog ref={ref} onCancel={onClose} aria-labelledby="confirm-title"><h2 id="confirm-title">{confirmation.title}</h2><p>{confirmation.body}</p><div className="dialog-actions"><button className="button secondary" autoFocus onClick={onClose}>Cancel</button><button className={`button ${confirmation.danger ? 'danger' : 'primary'}`} onClick={() => { confirmation.run(); onClose(); }}>{confirmation.action}</button></div></dialog>;
}

export function App() {
  const [initial] = useState(() => {
    try { return { progress: parseProgress(localStorage.getItem(STORAGE_KEY)), error: '' }; }
    catch { return { progress: emptyProgress(), error: 'Saved progress could not be loaded. A fresh session is available; browser storage may be unavailable or the saved data may be damaged.' }; }
  });
  const [progress, setProgress] = useState<Progress>(initial.progress);
  const [storageError, setStorageError] = useState(initial.error);
  const [page, setPage] = useState<Page>(currentPage);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [randomize, setRandomize] = useState(true);
  const [sessionSize, setSessionSize] = useState('20');
  const [search, setSearch] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); }
    catch { setStorageError('Progress cannot be saved in this browser. You can keep practicing, but changes may be lost when you close or refresh this page.'); }
  }, [progress]);
  useEffect(() => {
    const onHash = () => setPage(currentPage());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => { document.title = `${page[0].toUpperCase() + page.slice(1)} · Design Pattern Lab`; }, [page]);
  function navigate(next: Page) { location.hash = `/${next}`; setPage(next); window.scrollTo({ top: 0 }); }
  function setLanguage(language: Language) { setProgress(p => ({ ...p, language })); }
  const stats = statistics(progress);
  const active = progress.session;
  const pool = filterQuestions(progress, filters);
  function begin(session: Session) {
    if (!session.questionIds.length) return;
    const run = () => { setProgress(p => ({ ...p, session })); navigate('practice'); };
    if (active && !active.finished) {
      setConfirmation({ title: 'Start a new session?', body: 'This replaces your current session, including any unchecked selection. Checked answers and bookmarks stay in your learning history.', action: 'Start session', run });
    } else run();
  }
  function focusPool(kind: Filters['pool']) { setFilters({ ...defaultFilters, pool: kind }); navigate('dashboard'); setTimeout(() => document.getElementById('practice-builder')?.scrollIntoView({ behavior: 'smooth' }), 50); }
  function toggleBookmark(id: string) { setProgress(p => ({ ...p, bookmarks: p.bookmarks.includes(id) ? p.bookmarks.filter(x => x !== id) : [...p.bookmarks, id] })); }
  function restart() {
    if (!active) return;
    setConfirmation({ title: 'Restart this session?', body: 'Answers in this session will be cleared. Your checked-answer history and bookmarks will stay saved.', action: 'Restart session', run: () => {
      const session = createSession(active.questionIds.map(id => questionById[id]), active.title, active.questionIds.length, false);
      session.options = active.options;
      setProgress(p => ({ ...p, session })); navigate('practice');
    } });
  }
  const labels: Record<Page, string> = { dashboard: 'Overview', practice: 'Practice', progress: 'Your progress', settings: 'Settings' };
  const pageIcons: Record<Page, string> = { dashboard: 'grid', practice: 'book', progress: 'chart', settings: 'settings' };
  const sessionQuestion = active ? questionById[active.questionIds[active.index]] : null;
  const q = sessionQuestion;
  const checked = !!q && !!active?.checked.includes(q.id);
  const selected = q ? active?.answers[q.id] : undefined;
  const sessionCorrect = active?.checked.filter(id => active.answers[id] === questionById[id].patternId).length ?? 0;
  const filteredPatterns = patterns.filter(p => `${p.name} ${p.category}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="app-shell">
    <a className="skip-link" href="#main" onClick={e => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a>
    <aside className="sidebar">
      <a className="brand" href="#/dashboard" aria-label="Design Pattern Lab home"><span className="brand-mark"><Icon name="grid" size={24} /></span><span>Pattern<span className="brand-light">lab</span><small>DESIGN BETTER. EVERY DAY.</small></span></a>
      <div className="nav-caption">YOUR WORKSPACE</div>
      <nav aria-label="Main navigation">{(Object.keys(labels) as Page[]).map(item => <a key={item} href={`#/${item}`} aria-label={labels[item]} title={labels[item]} className={`nav-link ${page === item ? 'active' : ''}`} aria-current={page === item ? 'page' : undefined}><Icon name={pageIcons[item]} /><span>{labels[item]}</span>{item === 'practice' && active && !active.finished && <span className="nav-dot" />}</a>)}</nav>
      <div className="sidebar-bottom"><div className="little-book"><Icon name="book" /><strong>A little practice.<br />A better developer.</strong><p>Learn the intent behind the code.</p><a href="https://refactoring.guru/design-patterns" target="_blank" rel="noreferrer">Explore the reference <Icon name="external" size={13} /></a></div><div className="local-status"><span />{storageError ? 'Storage needs attention' : 'Saved on this browser'}</div></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><span>Workspace <span className="slash">/</span> <strong>{labels[page]}</strong></span><div className="topbar-right"><span className="language-label">Code examples</span><LanguageSwitch value={progress.language} onChange={setLanguage} /><span className="avatar" aria-hidden="true">PL</span></div></header>
      <main id="main" tabIndex={-1}>
        {storageError && <div className="storage-warning" role="alert">{storageError}</div>}
        {page === 'dashboard' && <>
          <div className="page-heading"><div><p className="eyebrow">YOUR DAILY DOSE OF BETTER DESIGN</p><h1>Small sessions. Lasting understanding.</h1><p>Go beyond the names. Learn when, why, and how to use design patterns.</p></div><span className="edition">22 PATTERNS · 132 QUESTIONS</span></div>
          <section className="hero"><div className="hero-copy"><span className="hero-pill"><span /> LEARN BY SOLVING</span><h2>Recognize the problem.<br /><em>Find the pattern.</em></h2><p>Real-world scenarios. Code you can read.<br />Clear explanations that make it click.</p><button className="button lime" onClick={() => active && !active.finished ? navigate('practice') : begin(createSession(questions, 'Quick practice', 10))}>{active && !active.finished ? 'Continue learning' : 'Start a quick practice'}<Icon name="arrow" size={18} /></button><small>{active && !active.finished ? `${active.checked.length} of ${active.questionIds.length} checked · ${active.title}` : '10 questions · A small step forward'}</small></div><div className="hero-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="art-node top-node">{ '{ }' }</div><div className="art-node left-node">◇</div><div className="art-node bottom-node">↗</div><div className="art-code"><div><i /><i /><i /></div><span className="art-comment">// a better way to build</span><p><b>problem</b>.understand();</p><p><b>pattern</b>.recognize();</p><p><b>knowledge</b>.apply();</p><span className="art-tag">LESS GUESSWORK. MORE INTENT.</span></div></div></section>
          <section className="stats-grid" aria-label="Learning summary"><Stat label="Questions studied" value={`${stats.studied}`} suffix={`/ ${stats.total}`} icon="book" note="Unique questions checked" /><Stat label="Answer accuracy" value={stats.accuracy === null ? '—' : `${stats.accuracy}%`} icon="target" note={stats.attempts ? `Across ${stats.attempts} checked attempts` : 'Your first answer starts the story'} /><Stat label="Ready to revisit" value={`${stats.mistakes}`} icon="reset" note="Latest answer was incorrect" onClick={() => focusPool('mistakes')} /><Stat label="Bookmarked" value={`${progress.bookmarks.length}`} icon="bookmark" note="Keep the tricky ones close" onClick={() => focusPool('bookmarks')} /></section>
          <section className="section"><div className="section-heading"><div><h2>Make practice your own</h2><p>Pick a pace. Build a little confidence.</p></div><span className="muted small">Progress saves automatically</span></div><div className="mode-grid">
            <ModeCard icon="shuffle" tone="green" title="Quick practice" label="10 QUESTIONS" text="A fresh mix of scenarios and code. Perfect for a short break." action="Let's practice" onClick={() => begin(createSession(questions, 'Quick practice', 10))} />
            <ModeCard icon="target" tone="orange" title="Study session" label="20 QUESTIONS" text="Go a little deeper, with questions you haven't tried first." action="Start studying" onClick={() => begin(createSession(questions, 'Study session', 20, true, progress))} />
            <ModeCard icon="book" tone="purple" title="Full practice" label="132 QUESTIONS" text="Work through the whole collection. Pause and return anytime." action="Explore all questions" onClick={() => begin(createSession(questions, 'Full practice', questions.length, false))} />
          </div></section>
          <section className="builder panel" id="practice-builder"><div className="section-heading"><div><p className="eyebrow">YOUR FOCUS, YOUR RULES</p><h2>Focused practice</h2><p>Spend more time on what matters to you.</p></div><span className="count-pill">{pool.length} matching questions</span></div><div className="filter-grid">
            <label>Question pool<select value={filters.pool} onChange={e => setFilters({ ...filters, pool: e.target.value as Filters['pool'] })}><option value="all">All questions</option><option value="unseen">Not studied yet</option><option value="mistakes">Review mistakes</option><option value="bookmarks">Bookmarked</option></select></label>
            <label>Category<select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value as Filters['category'], pattern: 'all' })}><option value="all">All categories</option>{(['Creational', 'Structural', 'Behavioral'] as Category[]).map(c => <option key={c}>{c}</option>)}</select></label>
            <label>Pattern<select value={filters.pattern} onChange={e => setFilters({ ...filters, pattern: e.target.value })}><option value="all">All patterns</option>{patterns.filter(p => filters.category === 'all' || p.category === filters.category).map(p => <option value={p.id} key={p.id}>{p.name}</option>)}</select></label>
            <label>Question type<select value={filters.kind} onChange={e => setFilters({ ...filters, kind: e.target.value as Filters['kind'] })}><option value="all">All types</option>{Object.entries(kindLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
          </div><div className="builder-bottom"><div className="builder-options"><label className="checkbox-label"><input type="checkbox" checked={randomize} onChange={e => setRandomize(e.target.checked)} />Shuffle questions & choices</label><label className="inline-label">Session size<select aria-label="Session size" value={sessionSize} onChange={e => setSessionSize(e.target.value)}><option value="10">10</option><option value="20">20</option><option value="all">All matches</option></select></label></div><button className="button primary" disabled={!pool.length} onClick={() => begin(createSession(pool, 'Focused practice', sessionSize === 'all' ? pool.length : Number(sessionSize), randomize))}>Start focused practice<Icon name="arrow" size={17} /></button></div>{!pool.length && <p className="empty-hint">No questions match yet. Try another filter, answer a few questions, or add a bookmark.</p>}</section>
          <div className="reference-note"><Icon name="book" size={18} /><p>Built around the 22 patterns in the <a href="https://refactoring.guru/design-patterns/catalog" target="_blank" rel="noreferrer">Refactoring.Guru catalog ↗</a>. Original practice questions, with a reference after every answer.</p></div>
        </>}
        {page === 'practice' && (!active || !q ? <div className="empty-state panel"><span className="empty-icon"><Icon name="book" size={32} /></span><h1>Your next insight starts here.</h1><p>Choose a session to begin exploring design patterns.</p><button className="button primary" onClick={() => navigate('dashboard')}>Choose a session<Icon name="arrow" /></button></div> : active.finished ? <>
          <div className="completion panel"><span className="completion-check"><Icon name="check" size={32} /></span><p className="eyebrow">SESSION COMPLETE</p><h1>Another step toward better design.</h1><p>You checked all {active.questionIds.length} questions in {active.title.toLowerCase()}.</p><div className="result-score">{sessionCorrect}<span> / {active.questionIds.length}</span></div><p>correct answers · {Math.round(sessionCorrect / active.questionIds.length * 100)}% accuracy this session</p><div className="completion-actions"><button className="button primary" onClick={() => navigate('dashboard')}>Back to overview<Icon name="arrow" /></button><button className="button secondary" onClick={restart}>Practice again</button></div></div>
          <section className="section"><h2>Session review</h2><div className="review-list">{active.questionIds.map((id, i) => { const item = questionById[id]; const correct = active.answers[id] === item.patternId; return <div className="review-row" key={id}><span className={`result-dot ${correct ? 'correct' : 'wrong'}`}>{correct ? '✓' : '×'}</span><div><small>{i + 1} · {kindLabels[item.kind]}</small><strong>{patternById[item.patternId].name}</strong><p>{item.explanation}</p><span className="muted small">Your answer: {patternById[active.answers[id]].name}</span> · <a href={item.reference} target="_blank" rel="noreferrer">Reference ↗</a></div><button className={`icon-button ${progress.bookmarks.includes(id) ? 'is-bookmarked' : ''}`} aria-label={`${progress.bookmarks.includes(id) ? 'Remove' : 'Add'} bookmark for question ${i + 1}`} aria-pressed={progress.bookmarks.includes(id)} onClick={() => toggleBookmark(id)}><Icon name="bookmark" /></button></div>; })}</div></section>
        </> : <>
          <div className="practice-top"><div><p className="eyebrow">{active.title}</p><h1>One problem. A better approach.</h1></div><button className="text-button" onClick={restart}><Icon name="reset" size={16} />Restart session</button></div>
          <div className="session-progress"><div><span>Question <strong>{active.index + 1}</strong> of {active.questionIds.length}</span><span>{active.checked.length} checked · {sessionCorrect} correct</span></div><Meter value={active.checked.length} total={active.questionIds.length} /></div>
          <div className="practice-layout"><section className="question-panel panel"><div className="question-meta"><div><span className="tag">{kindLabels[q.kind]}</span><span className="difficulty">{q.difficulty}</span></div><button className={`icon-button ${progress.bookmarks.includes(q.id) ? 'is-bookmarked' : ''}`} title="Bookmark this question" aria-label={progress.bookmarks.includes(q.id) ? 'Remove bookmark' : 'Bookmark this question'} aria-pressed={progress.bookmarks.includes(q.id)} onClick={() => toggleBookmark(q.id)}><Icon name="bookmark" /></button></div>
            <h2 ref={heading} tabIndex={-1} className="question-prompt">{q.prompt}</h2>
            {q.code && <><div className="code-language"><span className="small muted">Same question, your preferred language</span><LanguageSwitch value={progress.language} onChange={setLanguage} /></div><CodeBlock code={q.code[progress.language]} language={progress.language} /></>}
            <fieldset className="answers" disabled={checked}><legend>Choose the best-fitting pattern</legend>{active.options[q.id].map((id, i) => <label className={`answer ${selected === id ? 'chosen' : ''} ${checked && id === q.patternId ? 'right' : ''} ${checked && selected === id && id !== q.patternId ? 'incorrect' : ''}`} key={id}><input type="radio" name={q.id} value={id} checked={selected === id} onChange={() => setProgress(p => chooseAnswer(p, q.id, id))} /><span className="answer-letter">{'ABCD'[i]}</span><span>{patternById[id].name}</span>{checked && id === q.patternId && <span className="answer-status">✓ Correct</span>}{checked && selected === id && id !== q.patternId && <span className="answer-status">× Your answer</span>}</label>)}</fieldset>
            {checked && <div className={`explanation ${selected === q.patternId ? 'success' : 'retry'}`} role="status"><h3>{selected === q.patternId ? 'Exactly. Here’s why.' : 'A useful distinction to remember.'}</h3><p><strong>{patternById[q.patternId].name}:</strong> {q.explanation}</p><details><summary>Why not the other patterns?</summary>{q.options.filter(id => id !== q.patternId).map(id => <p key={id}><strong>{patternById[id].name}.</strong> {q.rationale[id]}</p>)}</details><a href={q.reference} target="_blank" rel="noreferrer">Read about {patternById[q.patternId].name}<Icon name="external" size={14} /></a></div>}
            <div className="question-actions"><button className="button secondary" disabled={active.index === 0} onClick={() => { setProgress(p => ({ ...p, session: { ...p.session!, index: active.index - 1 } })); heading.current?.focus(); }}>Previous</button>{!checked ? <button className="button primary" disabled={!selected} onClick={() => setProgress(p => checkAnswer(p, q.id))}>Check answer<Icon name="check" size={17} /></button> : <button className="button primary" onClick={() => {
              const next = active.index < active.questionIds.length - 1 ? active.index + 1 : active.questionIds.findIndex(id => !active.checked.includes(id));
              setProgress(p => ({ ...p, session: { ...p.session!, ...(next < 0 ? { finished: true } : { index: next }) } }));
              window.scrollTo({ top: 0, behavior: 'smooth' }); heading.current?.focus();
            }}>{active.checked.length === active.questionIds.length && active.index === active.questionIds.length - 1 ? 'See results' : active.index === active.questionIds.length - 1 ? 'Next unchecked' : 'Next question'}<Icon name="arrow" size={17} /></button>}</div>
          </section><aside className="session-aside"><div className="panel question-map"><h3>Your session</h3><p className="small muted">Move freely. Pick up where you left off.</p><div className="question-dots">{active.questionIds.map((id, index) => <button key={id} aria-label={`Question ${index + 1}${active.checked.includes(id) ? ', checked' : ', unchecked'}`} aria-current={index === active.index ? 'step' : undefined} className={`${index === active.index ? 'current' : ''} ${active.checked.includes(id) ? active.answers[id] === questionById[id].patternId ? 'done-right' : 'done-wrong' : ''}`} onClick={() => { setProgress(p => ({ ...p, session: { ...p.session!, index } })); heading.current?.focus(); }}>{index + 1}</button>)}</div><div className="map-legend"><span>○ Unchecked</span><span>✓ Correct</span><span>× Revisit</span></div></div><div className="study-tip"><Icon name="target" /><h3>Look for the intent.</h3><p>Several patterns can look alike. Focus on the problem being solved and the constraints that matter.</p></div><p className="small muted save-note"><Icon name="check" size={14} />{storageError ? 'Browser storage is unavailable.' : 'Your selection is saved automatically.'}</p></aside></div>
        </>)}
        {page === 'progress' && <>
          <div className="page-heading"><div><p className="eyebrow">SEE WHAT’S TAKING SHAPE</p><h1>Your learning, in perspective.</h1><p>Coverage shows what you’ve tried. Accuracy shows where to revisit.</p></div></div>
          <section className="stats-grid"><Stat label="Coverage" value={`${Math.round(stats.studied / questions.length * 100)}%`} icon="book" note={`${stats.studied} of ${questions.length} unique questions`} /><Stat label="Answer accuracy" value={stats.accuracy === null ? '—' : `${stats.accuracy}%`} icon="target" note="All checked attempts, including retries" /><Stat label="Review mistakes" value={String(stats.mistakes)} icon="reset" note="Based on your latest answers" onClick={() => focusPool('mistakes')} /><Stat label="Saved for later" value={String(progress.bookmarks.length)} icon="bookmark" note="Your bookmarked questions" onClick={() => focusPool('bookmarks')} /></section>
          <div className="type-stats">{(Object.keys(kindLabels) as QuestionKind[]).map(kind => { const s = statistics(progress, questions.filter(q => q.kind === kind)); return <div className="panel" key={kind}><span className="muted small">{kindLabels[kind]}</span><h3>{s.accuracy === null ? '—' : `${s.accuracy}%`}<small> accuracy</small></h3><Meter value={s.studied} total={s.total} /><p className="small muted">{s.studied} / {s.total} studied</p></div>; })}</div>
          <section className="section"><div className="section-heading"><div><h2>The pattern collection</h2><p>Six perspectives on each pattern. Keep connecting the dots.</p></div><label className="search-label"><span className="sr-only">Search patterns</span><input type="search" placeholder="Find a pattern…" value={search} onChange={e => setSearch(e.target.value)} /></label></div><div className="pattern-grid">{filteredPatterns.map(p => { const s = statistics(progress, questions.filter(q => q.patternId === p.id)); return <article className="panel pattern-card" key={p.id}><span className={`category ${p.category.toLowerCase()}`}>{p.category}</span><h3>{p.name}</h3><p>{p.intent}</p><Meter value={s.studied} total={6} /><div className="pattern-stat"><span>{s.studied}/6 studied</span><span>{s.accuracy === null ? 'Not started' : `${s.accuracy}% accuracy`}</span></div><div className="pattern-actions"><button className="text-button" onClick={() => begin(createSession(questions.filter(q => q.patternId === p.id), `${p.name} practice`, 6))}>Practice<Icon name="arrow" size={14} /></button><a href={`https://refactoring.guru/design-patterns/${p.id}`} target="_blank" rel="noreferrer" aria-label={`${p.name} reference`}>Reference ↗</a></div></article>; })}</div>{!filteredPatterns.length && <p className="empty-hint">No pattern matches “{search}”. Try another name.</p>}</section>
        </>}
        {page === 'settings' && <>
          <div className="page-heading"><div><p className="eyebrow">MAKE YOURSELF AT HOME</p><h1>A lab that works your way.</h1><p>Your preferences and progress stay in this browser.</p></div></div>
          <div className="settings-stack"><section className="panel settings-card"><div><h2>Code language</h2><p>Used for all code examples. Switch anytime without changing your answers.</p></div><LanguageSwitch value={progress.language} onChange={setLanguage} /></section><section className="panel settings-card"><div><h2>Restart current session</h2><p>Clear session answers and start the same set again. Keep your learning history and bookmarks.</p></div><button className="button secondary" disabled={!active} onClick={restart}><Icon name="reset" size={17} />Restart session</button></section><section className="panel settings-card danger-zone"><div><h2>Reset all progress</h2><p>Remove all answers, history, bookmarks, and preferences from this browser. This cannot be undone.</p></div><button className="button danger-outline" onClick={() => setConfirmation({ title: 'Reset all progress?', body: 'All checked answers, bookmarks, your active session, and language preference will be removed from this browser. This cannot be undone.', action: 'Reset everything', danger: true, run: () => { setProgress(emptyProgress()); setFilters(defaultFilters); navigate('dashboard'); } })}>Reset all progress</button></section><section className="panel about-card"><h2>About this lab</h2><p>132 original questions across 22 design patterns, with Java and TypeScript code examples. Examples isolate the relevant collaboration; they are teaching snippets, not complete production implementations.</p><p>Code examples target Java 17+ and modern TypeScript. Each code question has equivalent examples in both languages and counts as one question.</p><p>Progress uses local storage. It is specific to this browser and site address; clearing browser data removes it. No account or server is required.</p><p>Learning references: <a href="https://refactoring.guru/design-patterns" target="_blank" rel="noreferrer">Refactoring.Guru ↗</a>. This independent project is not affiliated with Refactoring.Guru.</p></section></div>
        </>}
        <footer><span>Patternlab <span className="footer-dot">·</span> A practice space for thoughtful developers.</span><span>Learn the why. Build with intent.</span></footer>
      </main>
    </div>
    {confirmation && <ConfirmDialog confirmation={confirmation} onClose={() => setConfirmation(null)} />}
  </div>;
}
function Stat({ label, value, suffix, icon, note, onClick }: { label: string; value: string; suffix?: string; icon: string; note: string; onClick?: () => void }) {
  const content = <><div className="stat-top"><span>{label}</span><Icon name={icon} size={18} /></div><div className="stat-value">{value}<small>{suffix}</small></div><p>{note}</p></>;
  return onClick ? <button className="stat-card clickable" onClick={onClick}>{content}</button> : <div className="stat-card">{content}</div>;
}
function ModeCard({ icon, tone, title, label, text, action, onClick }: { icon: string; tone: string; title: string; label: string; text: string; action: string; onClick: () => void }) {
  return <article className="mode-card panel"><div className="mode-top"><span className={`mode-icon ${tone}`}><Icon name={icon} size={23} /></span><span>{label}</span></div><h3>{title}</h3><p>{text}</p><button className="text-button" onClick={onClick}>{action}<Icon name="arrow" size={17} /></button></article>;
}
