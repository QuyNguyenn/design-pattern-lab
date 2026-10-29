export type Language = 'typescript' | 'java';
export type Theme = 'light' | 'dark' | 'system';
export type Category = 'Creational' | 'Structural' | 'Behavioral';
export type QuestionKind = 'scenario' | 'comparison' | 'code' | 'refactor';
export interface Example {
  prompt: string;
  explanation: string;
  code?: Record<Language, string>;
}
export interface Pattern {
  id: string;
  name: string;
  category: Category;
  intent: string;
  alternatives: [string, string, string];
  contrasts: [string, string, string];
  scenarios: [Example, Example, Example];
  code: [Example, Example];
  refactor: Example;
}
export interface Question extends Example {
  id: string;
  patternId: string;
  category: Category;
  kind: QuestionKind;
  difficulty: 'Foundation' | 'Applied' | 'Advanced';
  options: string[];
  rationale: Record<string, string>;
  reference: string;
}
export interface Attempt {
  questionId: string;
  answer: string;
  correct: boolean;
  at: string;
}
export interface Session {
  id: string;
  title: string;
  questionIds: string[];
  index: number;
  options: Record<string, string[]>;
  answers: Record<string, string>;
  checked: string[];
  finished: boolean;
  archived?: boolean;
}
export type SessionSnapshot = Readonly<
  Omit<Session, 'questionIds' | 'checked' | 'options' | 'answers'> & {
    questionIds: readonly string[];
    checked: readonly string[];
    options: Readonly<Record<string, readonly string[]>>;
    answers: Readonly<Record<string, string>>;
  }
>;
export interface SessionRecord {
  readonly savedAt: string;
  readonly outcome: 'completed' | 'cancelled' | 'restarted' | 'replaced';
  readonly language: Language;
  readonly correctCount: number;
  readonly session: SessionSnapshot;
}
export interface Progress {
  version: 2;
  history: SessionRecord[];
  language: Language;
  theme: Theme;
  bookmarks: string[];
  attempts: Attempt[];
  session: Session | null;
}
