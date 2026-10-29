import { questionById, questions } from './data/index.ts';
import type {
  Progress,
  Session,
  Question,
  Category,
  QuestionKind,
  SessionRecord,
} from './types.ts';

// Keep the established key so v1 payloads can migrate in place to the v2 schema.
export const STORAGE_KEY = 'design-pattern-lab:progress:v1';
export const emptyProgress = (): Progress => ({
  version: 2,
  history: [],
  language: 'typescript',
  theme: 'system',
  bookmarks: [],
  attempts: [],
  session: null,
});
export function shuffle<T>(items: readonly T[], random = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function latestAttempts(progress: Progress) {
  return new Map(progress.attempts.map((a) => [a.questionId, a]));
}
export function statistics(progress: Progress, pool = questions) {
  const ids = new Set(pool.map((q) => q.id));
  const attempts = progress.attempts.filter((a) => ids.has(a.questionId));
  const latest = [...latestAttempts(progress).values()].filter((a) => ids.has(a.questionId));
  return {
    total: pool.length,
    studied: latest.length,
    attempts: attempts.length,
    accuracy: attempts.length
      ? Math.round((100 * attempts.filter((a) => a.correct).length) / attempts.length)
      : null,
    mistakes: latest.filter((a) => !a.correct).length,
  };
}
export interface Filters {
  category: Category | 'all';
  pattern: string;
  kind: QuestionKind | 'all';
  pool: 'all' | 'mistakes' | 'bookmarks' | 'unseen';
}
export const defaultFilters: Filters = {
  category: 'all',
  pattern: 'all',
  kind: 'all',
  pool: 'all',
};
export function filterQuestions(progress: Progress, filters: Filters): Question[] {
  const latest = latestAttempts(progress);
  return questions.filter(
    (q) =>
      (filters.category === 'all' || q.category === filters.category) &&
      (filters.pattern === 'all' || q.patternId === filters.pattern) &&
      (filters.kind === 'all' || q.kind === filters.kind) &&
      (filters.pool === 'all' ||
        (filters.pool === 'mistakes' && latest.get(q.id)?.correct === false) ||
        (filters.pool === 'bookmarks' && progress.bookmarks.includes(q.id)) ||
        (filters.pool === 'unseen' && !latest.has(q.id))),
  );
}
export function createSession(
  pool: Question[],
  title: string,
  count = pool.length,
  randomize = true,
  unseenFirst?: Progress,
): Session {
  let ordered = randomize ? shuffle(pool) : [...pool];
  if (unseenFirst) {
    const latest = latestAttempts(unseenFirst);
    ordered = [
      ...ordered.filter((q) => !latest.has(q.id)),
      ...ordered.filter((q) => latest.has(q.id)),
    ];
  }
  const selected = ordered.slice(0, count);
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title,
    questionIds: selected.map((q) => q.id),
    index: 0,
    options: Object.fromEntries(
      selected.map((q) => [q.id, randomize ? shuffle(q.options) : [...q.options]]),
    ),
    answers: {},
    checked: [],
    finished: false,
  };
}
export function sessionMistakes(session: Session): Question[] {
  return session.questionIds
    .filter(
      (id) => session.checked.includes(id) && session.answers[id] !== questionById[id].patternId,
    )
    .map((id) => questionById[id]);
}

export function chooseAnswer(progress: Progress, questionId: string, answer: string): Progress {
  const s = progress.session;
  if (
    !s ||
    s.finished ||
    !s.questionIds.includes(questionId) ||
    s.checked.includes(questionId) ||
    !questionById[questionId]?.options.includes(answer)
  )
    return progress;
  return { ...progress, session: { ...s, answers: { ...s.answers, [questionId]: answer } } };
}
export function checkAnswer(progress: Progress, questionId: string): Progress {
  const s = progress.session;
  if (
    !s ||
    s.finished ||
    !s.questionIds.includes(questionId) ||
    s.checked.includes(questionId) ||
    !s.answers[questionId]
  )
    return progress;
  const answer = s.answers[questionId];
  return {
    ...progress,
    session: { ...s, checked: [...s.checked, questionId] },
    attempts: [
      ...progress.attempts,
      {
        questionId,
        answer,
        correct: answer === questionById[questionId].patternId,
        at: new Date().toISOString(),
      },
    ],
  };
}
export function archiveSession(
  progress: Progress,
  outcome: SessionRecord['outcome'],
  savedAt = new Date().toISOString(),
): Progress {
  const session = progress.session;
  if (!session || session.archived) return progress;
  if (progress.history.some((record) => record.session.id === session.id)) {
    return { ...progress, session: { ...session, archived: true } };
  }
  const snapshot = {
    ...session,
    archived: true,
    questionIds: [...session.questionIds],
    checked: [...session.checked],
    answers: { ...session.answers },
    options: Object.fromEntries(
      Object.entries(session.options).map(([id, options]) => [id, [...options]]),
    ),
  };
  return {
    ...progress,
    session: { ...session, archived: true },
    history: [
      ...progress.history,
      {
        savedAt,
        outcome: session.finished ? 'completed' : outcome,
        language: progress.language,
        correctCount: session.checked.filter(
          (id) => session.answers[id] === questionById[id].patternId,
        ).length,
        session: snapshot,
      },
    ],
  };
}

export function finishSession(progress: Progress): Progress {
  const session = progress.session;
  if (!session || session.checked.length !== session.questionIds.length) return progress;
  return archiveSession({ ...progress, session: { ...session, finished: true } }, 'completed');
}

export function deleteSessionRecord(progress: Progress, id: string): Progress {
  return { ...progress, history: progress.history.filter((record) => record.session.id !== id) };
}

export function clearSessionHistory(progress: Progress): Progress {
  return { ...progress, history: [] };
}

export function canCheckAllAnswered(progress: Progress): boolean {
  const session = progress.session;
  return (
    !!session &&
    !session.finished &&
    session.questionIds.every((id) => !!session.answers[id]) &&
    session.questionIds.some((id) => !session.checked.includes(id))
  );
}
export function checkAllAnswered(progress: Progress): Progress {
  if (!canCheckAllAnswered(progress)) return progress;
  const session = progress.session!;

  const checked = session.questionIds.reduce((current, id) => checkAnswer(current, id), progress);
  return finishSession(checked);
}
// Validate the stored version and every reference before letting external JSON reach UI state.
export function parseProgress(raw: string | null): Progress {
  if (!raw) return emptyProgress();
  const data = JSON.parse(raw) as Progress;
  const fail = () => {
    throw new Error('Saved progress is incompatible or damaged.');
  };
  if (
    !data ||
    ![1, 2].includes(data.version) ||
    !['typescript', 'java'].includes(data.language) ||
    (data.theme !== undefined && !['light', 'dark', 'system'].includes(data.theme)) ||
    !Array.isArray(data.bookmarks) ||
    !Array.isArray(data.attempts)
  )
    return fail();
  // Keep saved progress from before theme preferences were added readable.
  data.theme ??= 'system';
  if (
    data.bookmarks.some((id) => typeof id !== 'string' || !questionById[id]) ||
    new Set(data.bookmarks).size !== data.bookmarks.length
  )
    return fail();
  if (
    data.attempts.some(
      (a) =>
        !a ||
        !questionById[a.questionId]?.options.includes(a.answer) ||
        a.correct !== (a.answer === questionById[a.questionId].patternId) ||
        typeof a.at !== 'string' ||
        !Number.isFinite(Date.parse(a.at)),
    )
  )
    return fail();
  validateSession(data.session);
  const legacy = (data as unknown as { version: number }).version === 1;
  if (legacy) {
    data.version = 2;
    data.history = [];
    // Older versions cannot reconstruct past sessions from attempts alone.
    // Preserve the one complete session still available in saved state.
    if (data.session?.finished) return archiveSession(data, 'completed');
  }
  if (!Array.isArray(data.history)) return fail();
  const ids = new Set<string>();
  for (const record of data.history) {
    if (
      !record ||
      !record.session ||
      !['completed', 'cancelled', 'restarted', 'replaced'].includes(record.outcome) ||
      !['java', 'typescript'].includes(record.language) ||
      typeof record.savedAt !== 'string' ||
      !Number.isFinite(Date.parse(record.savedAt))
    )
      return fail();
    validateSession(record.session);
    const snapshot = record.session;
    if (
      !snapshot.archived ||
      ids.has(snapshot.id) ||
      (record.outcome === 'completed') !== snapshot.finished ||
      record.correctCount !==
        snapshot.checked.filter((id) => snapshot.answers[id] === questionById[id].patternId).length
    )
      return fail();
    ids.add(snapshot.id);
  }
  return data;
}

function validateSession(s: Session | SessionRecord['session'] | null): void {
  if (s !== null) {
    if (
      !s ||
      typeof s.id !== 'string' ||
      typeof s.title !== 'string' ||
      typeof s.finished !== 'boolean' ||
      (s.archived !== undefined && typeof s.archived !== 'boolean') ||
      !Array.isArray(s.questionIds) ||
      !s.questionIds.length ||
      !Array.isArray(s.checked) ||
      !s.options ||
      !s.answers ||
      typeof s.options !== 'object' ||
      Array.isArray(s.options) ||
      Array.isArray(s.answers) ||
      typeof s.answers !== 'object' ||
      !Number.isInteger(s.index) ||
      s.index < 0 ||
      s.index >= s.questionIds.length
    )
      throw new Error('Saved session is damaged.');
    if (
      new Set(s.questionIds).size !== s.questionIds.length ||
      s.questionIds.some((id) => !questionById[id])
    )
      throw new Error('Saved session is damaged.');
    for (const id of s.questionIds) {
      const options = s.options[id];
      if (
        !Array.isArray(options) ||
        options.length !== 4 ||
        new Set(options).size !== 4 ||
        options.some((o) => !questionById[id].options.includes(o))
      )
        throw new Error('Saved session is damaged.');
    }
    if (
      Object.entries(s.answers).some(
        ([id, answer]) => !s.questionIds.includes(id) || !questionById[id].options.includes(answer),
      )
    )
      throw new Error('Saved session is damaged.');
    if (
      new Set(s.checked).size !== s.checked.length ||
      s.checked.some((id) => !s.questionIds.includes(id) || !s.answers[id])
    )
      throw new Error('Saved session is damaged.');
    if (s.finished && s.checked.length !== s.questionIds.length)
      throw new Error('Saved session is damaged.');
  }
}
