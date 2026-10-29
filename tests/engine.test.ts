import test from 'node:test';
import assert from 'node:assert/strict';
import { patterns, questions, questionById } from '../src/data/index.ts';
import {
  emptyProgress,
  shuffle,
  createSession,
  chooseAnswer,
  checkAnswer,
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
  assert.throws(() => parseProgress(JSON.stringify({ ...emptyProgress(), version: 2 })));
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
