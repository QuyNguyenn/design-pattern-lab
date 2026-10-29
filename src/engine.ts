import { questionById, questions } from './data/index.ts';
import type { Progress, Session, Question, Category, QuestionKind } from './types.ts';

export const STORAGE_KEY = 'design-pattern-lab:progress:v1';
export const emptyProgress = (): Progress => ({ version: 1, language: 'typescript', bookmarks: [], attempts: [], session: null });
export function shuffle<T>(items: readonly T[], random = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function latestAttempts(progress: Progress) {
  return new Map(progress.attempts.map(a => [a.questionId, a]));
}
export function statistics(progress: Progress, pool = questions) {
  const ids = new Set(pool.map(q => q.id));
  const attempts = progress.attempts.filter(a => ids.has(a.questionId));
  const latest = [...latestAttempts(progress).values()].filter(a => ids.has(a.questionId));
  return {
    total: pool.length, studied: latest.length, attempts: attempts.length,
    accuracy: attempts.length ? Math.round(100 * attempts.filter(a => a.correct).length / attempts.length) : null,
    mistakes: latest.filter(a => !a.correct).length,
  };
}
export interface Filters { category: Category | 'all'; pattern: string; kind: QuestionKind | 'all'; pool: 'all' | 'mistakes' | 'bookmarks' | 'unseen' }
export const defaultFilters: Filters = { category: 'all', pattern: 'all', kind: 'all', pool: 'all' };
export function filterQuestions(progress: Progress, filters: Filters): Question[] {
  const latest = latestAttempts(progress);
  return questions.filter(q =>
    (filters.category === 'all' || q.category === filters.category) &&
    (filters.pattern === 'all' || q.patternId === filters.pattern) &&
    (filters.kind === 'all' || q.kind === filters.kind) &&
    (filters.pool === 'all' ||
      filters.pool === 'mistakes' && latest.get(q.id)?.correct === false ||
      filters.pool === 'bookmarks' && progress.bookmarks.includes(q.id) ||
      filters.pool === 'unseen' && !latest.has(q.id)),
  );
}
export function createSession(pool: Question[], title: string, count = pool.length, randomize = true, unseenFirst?: Progress): Session {
  let ordered = randomize ? shuffle(pool) : [...pool];
  if (unseenFirst) {
    const latest = latestAttempts(unseenFirst);
    ordered = [...ordered.filter(q => !latest.has(q.id)), ...ordered.filter(q => latest.has(q.id))];
  }
  const selected = ordered.slice(0, count);
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, title,
    questionIds: selected.map(q => q.id), index: 0,
    options: Object.fromEntries(selected.map(q => [q.id, randomize ? shuffle(q.options) : [...q.options]])),
    answers: {}, checked: [], finished: false,
  };
}
export function chooseAnswer(progress: Progress, questionId: string, answer: string): Progress {
  const s = progress.session;
  if (!s || s.finished || !s.questionIds.includes(questionId) || s.checked.includes(questionId) || !questionById[questionId]?.options.includes(answer)) return progress;
  return { ...progress, session: { ...s, answers: { ...s.answers, [questionId]: answer } } };
}
export function checkAnswer(progress: Progress, questionId: string): Progress {
  const s = progress.session;
  if (!s || s.finished || !s.questionIds.includes(questionId) || s.checked.includes(questionId) || !s.answers[questionId]) return progress;
  const answer = s.answers[questionId];
  return {
    ...progress,
    session: { ...s, checked: [...s.checked, questionId] },
    attempts: [...progress.attempts, { questionId, answer, correct: answer === questionById[questionId].patternId, at: new Date().toISOString() }],
  };
}
// Validate the stored version and every reference before letting external JSON reach UI state.
export function parseProgress(raw: string | null): Progress {
  if (!raw) return emptyProgress();
  const data = JSON.parse(raw) as Progress;
  const fail = () => { throw new Error('Saved progress is incompatible or damaged.'); };
  if (!data || data.version !== 1 || !['typescript', 'java'].includes(data.language) ||
    !Array.isArray(data.bookmarks) || !Array.isArray(data.attempts)) return fail();
  if (data.bookmarks.some(id => typeof id !== 'string' || !questionById[id]) || new Set(data.bookmarks).size !== data.bookmarks.length) return fail();
  if (data.attempts.some(a => !a || !questionById[a.questionId]?.options.includes(a.answer) ||
    a.correct !== (a.answer === questionById[a.questionId].patternId) || typeof a.at !== 'string' || !Number.isFinite(Date.parse(a.at)))) return fail();
  const s = data.session;
  if (s !== null) {
    if (!s || typeof s.id !== 'string' || typeof s.title !== 'string' || typeof s.finished !== 'boolean' ||
      !Array.isArray(s.questionIds) || !s.questionIds.length || !Array.isArray(s.checked) ||
      !s.options || !s.answers || typeof s.options !== 'object' || typeof s.answers !== 'object' ||
      !Number.isInteger(s.index) || s.index < 0 || s.index >= s.questionIds.length) return fail();
    if (new Set(s.questionIds).size !== s.questionIds.length || s.questionIds.some(id => !questionById[id])) return fail();
    for (const id of s.questionIds) {
      const options = s.options[id];
      if (!Array.isArray(options) || options.length !== 4 || new Set(options).size !== 4 || options.some(o => !questionById[id].options.includes(o))) return fail();
    }
    if (Object.entries(s.answers).some(([id, answer]) => !s.questionIds.includes(id) || !questionById[id].options.includes(answer))) return fail();
    if (new Set(s.checked).size !== s.checked.length || s.checked.some(id => !s.questionIds.includes(id) || !s.answers[id])) return fail();
    if (s.finished && s.checked.length !== s.questionIds.length) return fail();
  }
  return data;
}
