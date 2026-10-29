# Working in Design Pattern Lab

## Product boundaries

This is an English-language, browser-only learning SPA built with React, TypeScript, and Vite. It targets GitHub Pages, with no backend or account requirement. The current collection has 132 questions across 22 patterns. Code questions support both Java 17+ and TypeScript.

Keep UI copy, questions, explanations, and repository documentation in English. Match the user's language in conversation. Preserve this scope unless the requested change deliberately expands it.

## Where changes belong

- `src/App.tsx`: app shell, navigation, state orchestration, and screen composition. Keep screen markup in `src/screens/`.
- `src/app-context.tsx`: typed view-model boundary shared by the screen components. Keep its contract explicit; move reusable domain behavior to `engine.ts`.
- `src/components/`: shared presentational components grouped by responsibility. Keep screen-specific UI inside its screen module; extract repeated layout such as page and section headings when multiple screens use the same structure.
- `src/engine.ts`: session creation, answer checking, filters, statistics, and saved-data validation. Keep learning-state rules here rather than duplicating them in views.
- `src/types.ts`: shared contracts.
- `src/data/{creational,structural,behavioral}.ts`: authored pattern records.
- `src/data/index.ts`: question assembly, stable IDs, options, and reference links.
- `src/CodeBlock.tsx` and `src/styles.css`: code presentation and responsive UI.
- `tests/engine.test.ts`: regression checks for content integrity and learning behavior.

For question-writing or content review, use the repository skill at [.agents/skills/design-pattern-content/SKILL.md](.agents/skills/design-pattern-content/SKILL.md). Read it when the task affects educational content; it is not necessary for unrelated UI or tooling edits.

## Learning-state invariants

- A choice is saved before checking. Only checking creates a scored attempt.
- A checked answer is locked within its session; repeated checking must not append attempts.
- Switching Java/TypeScript preserves question identity, selected answer, and progress.
- Refresh restores the active question and exact shuffled question/option order.
- Coverage counts distinct checked question IDs. Accuracy includes every checked attempt. Mistakes are determined by the latest checked answer for each question.
- Restart clears session answers while preserving history and bookmarks. Reset all clears history, session, bookmarks, and preferences after the app's confirmation.
- Persisted IDs currently include an example's positional suffix. Do not reorder examples, rename IDs, or reuse an old ID for a different question without an explicit migration/versioning decision.
- Keep saved-data validation and a visible storage-error fallback when changing persistence. Do not claim data is saved when a write fails.

## UI and deployment constraints

Use hash navigation and preserve the Vite base path for the repository deployment. The current base is `/design-pattern-lab/`. Refreshing a deep link must not depend on server rewrites.

Keep answers and reference links hidden until checking on the practice screen. Pattern references may remain available in the collection view. Render code as text, not injected HTML. Maintain keyboard controls, accessible names for icon-only navigation, and separately scrollable code blocks on mobile.

## Verification

Use the existing scripts; do not introduce a second package manager or replace the lockfile without a task-specific reason.

| Change                               | Relevant checks                                                                              |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| Application logic or UI              | `npm run check`; inspect affected UI flows when a browser is available                       |
| Questions, answers, or code snippets | `npm run check` and `npm run test:examples`                                                  |
| Documentation or skill only          | Validate links and instructions; validate a changed skill with the available skill validator |
| Build/deployment configuration       | Production build and review of base path, workflow conditions, and artifact paths            |

`npm run format` applies the repository Prettier config. `npm run lint` checks formatting before source hygiene checks, and `npm run check` starts with that lint step before strict typechecking, tests, and a production build. Run the formatter after editing source, documentation, configuration, or tests. `test:examples` requires JDK 17+ and compiles both languages in isolated temporary directories.

For persistence changes, exercise a pending answer across refresh, language switching, a correct retry after a wrong answer, and reset/restart semantics. For layout changes, inspect desktop and narrow mobile widths. Report blocked or skipped checks honestly rather than substituting an assumption of success.

## Git workflow

Use the GitHub Flow documented in [docs/branching-strategy.md](docs/branching-strategy.md): short-lived topic branches targeting `master`.

The user has authorized proactive branch, commit, push, and pull-request management for work in this repository. For each coherent task, create or reuse the appropriate topic branch, inspect the diff, run relevant checks, commit the intended changes, push the branch, and create or update its PR without asking again for these routine steps. Keep related follow-up changes on the existing branch/PR. Check remote PR status when available before creating duplicates.

Preserve unrelated working-tree changes and never discard them to make a commit easier. Use descriptive commits and PR descriptions that explain behavior and validation. If remote access fails, complete the local branch and commit, prepare a PR body, and report the exact remaining remote steps; do not misdiagnose a connection failure as invalid credentials.

This authorization does not include automatically merging PRs, force-pushing shared history, deleting unrelated branches, or changing remote security/settings. Branch protection is not presumed to be configured. Follow any later explicit user authorization for those actions.
