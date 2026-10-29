export type Language = 'typescript' | 'java';
export type Category = 'Creational' | 'Structural' | 'Behavioral';
export type QuestionKind = 'scenario' | 'comparison' | 'code' | 'refactor';
export interface Example { prompt: string; explanation: string; code?: Record<Language, string> }
export interface Pattern {
  id: string; name: string; category: Category; intent: string;
  alternatives: [string, string, string]; contrasts: [string, string, string];
  scenarios: [Example, Example, Example]; code: [Example, Example]; refactor: Example;
}
export interface Question extends Example {
  id: string; patternId: string; category: Category; kind: QuestionKind;
  difficulty: 'Foundation' | 'Applied' | 'Advanced'; options: string[];
  rationale: Record<string, string>; reference: string;
}
export interface Attempt { questionId: string; answer: string; correct: boolean; at: string }
export interface Session {
  id: string; title: string; questionIds: string[]; index: number;
  options: Record<string, string[]>; answers: Record<string, string>;
  checked: string[]; finished: boolean;
}
export interface Progress {
  version: 1; language: Language; bookmarks: string[]; attempts: Attempt[];
  session: Session | null;
}
