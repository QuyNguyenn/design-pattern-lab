import { creational } from './creational.ts';
import { structural } from './structural.ts';
import { behavioral } from './behavioral.ts';
import type { Example, Question, QuestionKind } from '../types.ts';

export const patterns = [...creational, ...structural, ...behavioral];
export const patternById = Object.fromEntries(patterns.map(p => [p.id, p]));
export const kindLabels: Record<QuestionKind, string> = {
  scenario: 'Scenario', comparison: 'Compare patterns', code: 'Read the code', refactor: 'Refactor code',
};
export const questions: Question[] = patterns.flatMap(p => {
  const examples: [Example, QuestionKind][] = [
    [p.scenarios[0], 'scenario'], [p.scenarios[1], 'scenario'],
    [p.scenarios[2], 'comparison'], [p.code[0], 'code'], [p.code[1], 'code'], [p.refactor, 'refactor'],
  ];
  return examples.map(([example, kind], i) => {
    const options = [p.id, ...p.alternatives];
    // A stable rotation prevents the correct option occupying the same slot in ordered practice.
    const offset = (patterns.indexOf(p) + i) % options.length;
    return {
      ...example, id: `${p.id}-${i + 1}`, patternId: p.id, category: p.category, kind,
      difficulty: i < 2 ? 'Foundation' : i === 2 || i === 5 ? 'Advanced' : 'Applied',
      options: [...options.slice(offset), ...options.slice(0, offset)],
      rationale: Object.fromEntries(p.alternatives.map((id, j) => [id, p.contrasts[j]])),
      reference: `https://refactoring.guru/design-patterns/${p.id}`,
    };
  });
});
export const questionById = Object.fromEntries(questions.map(q => [q.id, q]));
