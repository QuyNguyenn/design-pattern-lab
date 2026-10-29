import test from 'node:test';
import assert from 'node:assert/strict';
import { patterns, questions, questionById } from '../src/data/index.ts';
import {
  emptyProgress,
  archiveSession,
  finishSession,
  deleteSessionRecord,
  clearSessionHistory,
  shuffle,
  createSession,
  sessionMistakes,
  chooseAnswer,
  checkAnswer,
  canCheckAllAnswered,
  checkAllAnswered,
  parseProgress,
  statistics,
  filterQuestions,
  defaultFilters,
} from '../src/engine.ts';

test('catalog covers all 22 patterns and 132 distinct, well-formed questions', () => {
  assert.equal(patterns.length, 22);
  assert.equal(questions.length, 132);
  assert.equal(new Set(questions.map((q) => q.id)).size, 132);
  assert.equal(new Set(questions.map((q) => q.prompt)).size, 132);
  const ids = new Set(patterns.map((p) => p.id));
  for (const p of patterns) {
    const pool = questions.filter((q) => q.patternId === p.id);
    assert.equal(pool.length, 6);
    assert.equal(pool.filter((q) => q.kind === 'scenario').length, 2);
    assert.equal(pool.filter((q) => q.kind === 'code').length, 2);
    assert.equal(pool.filter((q) => q.kind === 'comparison').length, 1);
    assert.equal(pool.filter((q) => q.kind === 'refactor').length, 1);
  }
  for (const q of questions) {
    assert.equal(new Set(q.options).size, 4);
    assert.ok(q.options.includes(q.patternId));
    assert.ok(q.options.every((id) => ids.has(id)));
    assert.ok(q.explanation.length > 40);
    assert.equal(q.reference, `https://refactoring.guru/design-patterns/${q.patternId}`);
    for (const option of q.options.filter((id) => id !== q.patternId))
      assert.ok(q.rationale[option].length > 30);
    if (q.kind === 'code' || q.kind === 'refactor') {
      assert.ok(q.code?.java && q.code?.typescript);
    } else assert.equal(q.code, undefined);
  }
  assert.equal(questions.filter((q) => q.code).length, 66);
});

test('shuffle preserves membership and does not mutate its input', () => {
  const input = [1, 2, 3, 4, 5];
  const result = shuffle(input, () => 0);
  assert.deepEqual(input, [1, 2, 3, 4, 5]);
  assert.deepEqual([...result].sort(), input);
  assert.notDeepEqual(result, input);
});

test('random sessions never repeat a question or lose an option', () => {
  for (let iteration = 0; iteration < 30; iteration++) {
    const session = createSession(questions, 'Quick', 10);
    assert.equal(session.questionIds.length, 10);
    assert.equal(new Set(session.questionIds).size, 10);
    for (const id of session.questionIds)
      assert.deepEqual([...session.options[id]].sort(), [...questionById[id].options].sort());
  }
});

test('ordered sessions preserve order and cap at the available pool', () => {
  const pool = questions.slice(0, 6);
  const session = createSession(pool, 'Focused', 20, false);
  assert.deepEqual(
    session.questionIds,
    pool.map((q) => q.id),
  );
  for (const q of pool) assert.deepEqual(session.options[q.id], q.options);
});

test('unchecked answer, language, index, bookmarks and shuffled options survive a reload', () => {
  let p = { ...emptyProgress(), session: createSession(questions, 'Study', 20) };
  const id = p.session.questionIds[3];
  const answer = questionById[id].options[1];
  const next = chooseAnswer(
    { ...p, language: 'java', bookmarks: [id], session: { ...p.session, index: 3 } },
    id,
    answer,
  );
  const restored = parseProgress(JSON.stringify(next));
  assert.deepEqual(restored, next);
  assert.equal(restored.session?.answers[id], answer);
  assert.equal(restored.attempts.length, 0);
});

test('checking requires a choice, appends exactly one attempt and locks the answer', () => {
  const q = questions[0];
  let p = { ...emptyProgress(), session: createSession([q], 'One', 1, false) };
  assert.equal(checkAnswer(p, q.id).attempts.length, 0);
  const selected = chooseAnswer(p, q.id, q.patternId);
  const checked = checkAnswer(selected, q.id);
  assert.equal(checked.attempts.length, 1);
  assert.equal(checked.attempts[0].correct, true);
  assert.equal(statistics(checked).studied, 1);
  assert.equal(statistics(checked).accuracy, 100);
  assert.strictEqual(checkAnswer(checked, q.id), checked);
  assert.strictEqual(
    chooseAnswer(
      checked,
      q.id,
      q.options.find((id) => id !== q.patternId)!,
    ),
    checked,
  );
});

test('checking all remaining answers requires a complete set and finishes once', () => {
  const pool = questions.slice(0, 3);
  let p = { ...emptyProgress(), session: createSession(pool, 'Three', 3, false) };
  assert.equal(canCheckAllAnswered(p), false);
  p = chooseAnswer(p, pool[0].id, pool[0].patternId);
  assert.strictEqual(checkAllAnswered(p), p);

  p = chooseAnswer(
    p,
    pool[1].id,
    pool[1].options.find((id) => id !== pool[1].patternId)!,
  );
  p = chooseAnswer(p, pool[2].id, pool[2].patternId);
  assert.equal(canCheckAllAnswered(p), true);
  p = checkAnswer(p, pool[0].id);
  assert.equal(canCheckAllAnswered(p), true);
  const result = checkAllAnswered(p);

  assert.deepEqual(
    result.session?.checked,
    pool.map((q) => q.id),
  );
  assert.equal(result.session?.finished, true);
  assert.equal(result.attempts.length, 3);
  assert.equal(result.attempts.filter((attempt) => attempt.correct).length, 2);
  assert.equal(canCheckAllAnswered(result), false);
  assert.strictEqual(checkAllAnswered(result), result);
});

test('invalid answers and questions outside a session cannot alter progress', () => {
  const p = { ...emptyProgress(), session: createSession([questions[0]], 'One', 1, false) };
  assert.strictEqual(chooseAnswer(p, questions[0].id, 'unknown'), p);
  assert.strictEqual(chooseAnswer(p, questions[1].id, questions[1].patternId), p);
  assert.strictEqual(checkAnswer(p, questions[1].id), p);
});

test('a correct retry clears latest mistakes without inflating unique coverage', () => {
  const q = questions[0];
  let p = checkAnswer(
    chooseAnswer(
      { ...emptyProgress(), session: createSession([q], 'One') },
      q.id,
      q.options.find((id) => id !== q.patternId)!,
    ),
    q.id,
  );
  assert.equal(filterQuestions(p, { ...defaultFilters, pool: 'mistakes' }).length, 1);
  p = { ...p, session: createSession([q], 'Retry') };
  p = checkAnswer(chooseAnswer(p, q.id, q.patternId), q.id);
  assert.equal(filterQuestions(p, { ...defaultFilters, pool: 'mistakes' }).length, 0);
  assert.deepEqual(statistics(p), {
    total: 132,
    studied: 1,
    attempts: 2,
    accuracy: 50,
    mistakes: 0,
  });
});

test('study sessions prefer unseen questions and filters combine correctly', () => {
  const p = checkAnswer(
    chooseAnswer(
      { ...emptyProgress(), session: createSession([questions[0]], 'One') },
      questions[0].id,
      questions[0].patternId,
    ),
    questions[0].id,
  );
  const session = createSession(questions, 'Study', 20, false, p);
  assert.ok(!session.questionIds.includes(questions[0].id));
  assert.equal(filterQuestions(p, { ...defaultFilters, pool: 'unseen' }).length, 131);
  assert.equal(
    filterQuestions(p, { ...defaultFilters, category: 'Creational', kind: 'code' }).length,
    10,
  );
  assert.equal(filterQuestions(p, { ...defaultFilters, pattern: 'strategy' }).length, 6);
  assert.equal(filterQuestions(p, { ...defaultFilters, pool: 'bookmarks' }).length, 0);
});

test('storage parsing rejects damaged state and supports a fresh/reset state', () => {
  assert.deepEqual(parseProgress(null), emptyProgress());
  assert.deepEqual(parseProgress(JSON.stringify(emptyProgress())), emptyProgress());
  assert.throws(() => parseProgress('{'));
  assert.throws(() => parseProgress('null'));
  assert.throws(() => parseProgress(JSON.stringify({ ...emptyProgress(), version: 99 })));
  const session = createSession(questions, 'Study', 10);
  assert.throws(() =>
    parseProgress(JSON.stringify({ ...emptyProgress(), session: { ...session, index: 99 } })),
  );
  assert.throws(() =>
    parseProgress(JSON.stringify({ ...emptyProgress(), session: { ...session, finished: true } })),
  );
  assert.throws(() =>
    parseProgress(
      JSON.stringify({ ...emptyProgress(), session: { ...session, questionIds: ['missing'] } }),
    ),
  );
  assert.throws(() =>
    parseProgress(JSON.stringify({ ...emptyProgress(), session: { ...session, options: {} } })),
  );
  assert.throws(() =>
    parseProgress(JSON.stringify({ ...emptyProgress(), bookmarks: ['missing'] })),
  );
});

test('restarting preserves history while a full reset clears all learning state', () => {
  const q = questions[0];
  const p = checkAnswer(
    chooseAnswer(
      {
        ...emptyProgress(),
        bookmarks: [q.id],
        language: 'java',
        session: createSession([q], 'One'),
      },
      q.id,
      q.patternId,
    ),
    q.id,
  );
  const restarted = { ...p, session: createSession([q], 'One') };
  assert.equal(restarted.session.checked.length, 0);
  assert.deepEqual(restarted.session.answers, {});
  assert.equal(restarted.attempts.length, 1);
  assert.equal(restarted.language, 'java');
  assert.deepEqual(restarted.bookmarks, [q.id]);
  const reset = parseProgress(JSON.stringify(emptyProgress()));
  assert.equal(reset.session, null);
  assert.equal(reset.attempts.length, 0);
  assert.equal(reset.bookmarks.length, 0);
});

test('session mistake review includes only checked wrong answers from that session', () => {
  const pool = questions.slice(0, 4);
  let progress = {
    ...emptyProgress(),
    session: createSession(pool.slice(0, 3), 'Original', 3, false),
  };
  progress = checkAnswer(chooseAnswer(progress, pool[0].id, pool[0].patternId), pool[0].id);
  progress = checkAnswer(
    chooseAnswer(
      progress,
      pool[1].id,
      pool[1].options.find((id) => id !== pool[1].patternId)!,
    ),
    pool[1].id,
  );
  progress = chooseAnswer(
    progress,
    pool[2].id,
    pool[2].options.find((id) => id !== pool[2].patternId)!,
  );
  const snapshot = structuredClone(progress);
  const mistakes = sessionMistakes(progress.session!);
  assert.deepEqual(
    mistakes.map((q) => q.id),
    [pool[1].id],
  );
  const review = createSession(mistakes, 'Mistake review', mistakes.length, false);
  assert.deepEqual(review.questionIds, [pool[1].id]);
  assert.deepEqual(review.answers, {});
  assert.deepEqual(review.checked, []);
  assert.deepEqual(progress, snapshot);
  assert.deepEqual(sessionMistakes(createSession(pool, 'Fresh')), []);
});

test('session records are detached snapshots, survive reload, and stay fixed across retries', () => {
  const [q, pending] = questions;
  let progress = {
    ...emptyProgress(),
    bookmarks: [q.id],
    language: 'java',
    session: createSession([q, pending], 'Original', 2, false),
  };
  progress = chooseAnswer(
    progress,
    q.id,
    q.options.find((id) => id !== q.patternId)!,
  );
  progress = checkAnswer(progress, q.id);
  progress = chooseAnswer(progress, pending.id, pending.patternId);
  const original = structuredClone(progress);
  for (const outcome of ['cancelled', 'restarted', 'replaced']) {
    const archived = archiveSession(progress, outcome);
    assert.equal(archived.history[0].outcome, outcome);
    assert.deepEqual(archived.history[0].session.answers, progress.session.answers);
    assert.equal(archived.history[0].correctCount, 0);
    assert.equal(archived.attempts.length, 1);
    assert.notEqual(archived.history[0].session.answers, progress.session.answers);
    assert.notEqual(archived.history[0].session.options[q.id], progress.session.options[q.id]);
    assert.deepEqual(parseProgress(JSON.stringify(archived)), archived);
  }
  assert.deepEqual(progress, original);
  let next = archiveSession(progress, 'restarted');
  const record = structuredClone(next.history[0]);
  next = { ...next, language: 'typescript', session: createSession([q], 'Retry', 1, false) };
  next = finishSession(checkAnswer(chooseAnswer(next, q.id, q.patternId), q.id));
  assert.deepEqual(next.history[0], record);
  assert.equal(next.history[0].language, 'java');
  assert.equal(next.history[1].correctCount, 1);
  assert.equal(statistics(next).mistakes, 0);
  assert.equal(next.attempts.length, 2);
  assert.equal(finishSession(next).history.length, 2);
  assert.deepEqual(parseProgress(JSON.stringify(next)), next);
  const removed = deleteSessionRecord(next, next.session.id);
  assert.equal(removed.history.length, 1);
  assert.equal(archiveSession(removed, 'replaced').history.length, 1);
  const cleared = clearSessionHistory(next);
  assert.equal(cleared.history.length, 0);
  assert.deepEqual(cleared.attempts, next.attempts);
  assert.deepEqual(cleared.bookmarks, [q.id]);
  assert.equal(
    archiveSession(parseProgress(JSON.stringify(cleared)), 'replaced').history.length,
    0,
  );
  assert.deepEqual(emptyProgress().history, []);
});

test('v1 migration preserves pending sessions and archives the available completed session once', () => {
  const q = questions[0];
  const legacy = {
    ...emptyProgress(),
    version: 1,
    session: createSession([q], 'Legacy', 1, false),
  };
  delete legacy.history;
  const pending = chooseAnswer({ ...emptyProgress(), session: legacy.session }, q.id, q.patternId);
  const restored = parseProgress(JSON.stringify({ ...legacy, session: pending.session }));
  assert.equal(restored.version, 2);
  assert.deepEqual(restored.session, pending.session);
  assert.deepEqual(restored.history, []);
  const complete = checkAnswer(pending, q.id);
  const migrated = parseProgress(
    JSON.stringify({
      ...legacy,
      attempts: complete.attempts,
      session: { ...complete.session, finished: true },
    }),
  );
  assert.equal(migrated.history.length, 1);
  assert.equal(migrated.history[0].outcome, 'completed');
  assert.equal(parseProgress(JSON.stringify(migrated)).history.length, 1);
});

test('history validation rejects damaged snapshots, scores, dates, and duplicate records', () => {
  const q = questions[0];
  const complete = finishSession(
    checkAnswer(
      chooseAnswer({ ...emptyProgress(), session: createSession([q], 'One') }, q.id, q.patternId),
      q.id,
    ),
  );
  for (const change of [
    (p) => {
      p.history = null;
    },
    (p) => {
      p.history.push(p.history[0]);
    },
    (p) => {
      p.history[0].correctCount = 10;
    },
    (p) => {
      p.history[0].savedAt = 'invalid';
    },
    (p) => {
      p.history[0].session.options[q.id] = [];
    },
    (p) => {
      p.history[0].session.archived = false;
    },
    (p) => {
      p.history[0].outcome = 'cancelled';
    },
    (p) => {
      p.history[0].language = 'unknown';
    },
  ]) {
    const damaged = structuredClone(complete);
    change(damaged);
    assert.throws(() => parseProgress(JSON.stringify(damaged)));
  }
});

test('sidebar preference persists and older payloads default to an expanded sidebar', () => {
  const stored = { ...emptyProgress(), sidebarCollapsed: true };
  assert.equal(parseProgress(JSON.stringify(stored)).sidebarCollapsed, true);
  const older = { ...emptyProgress() };
  delete older.sidebarCollapsed;
  assert.equal(parseProgress(JSON.stringify(older)).sidebarCollapsed, false);
  assert.throws(() => parseProgress(JSON.stringify({ ...stored, sidebarCollapsed: 'true' })));
  assert.equal(emptyProgress().sidebarCollapsed, false);
});
