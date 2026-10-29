# Design Pattern Lab

An English-language practice app for recognizing design patterns from problems and code. Built with React, TypeScript, and Vite; deploys as a static SPA to GitHub Pages.

## Practice collection

132 original multiple-choice questions cover all 22 patterns in the [Refactoring.Guru catalog](https://refactoring.guru/design-patterns/catalog).

| Question type                    | Per pattern |   Total |
| -------------------------------- | ----------: | ------: |
| Foundational scenarios           |           2 |      44 |
| Distinguish similar patterns     |           1 |      22 |
| Recognize a pattern in code      |           2 |      44 |
| Choose a pattern for refactoring |           1 |      22 |
| **Total**                        |       **6** | **132** |

Every code question includes equivalent **Java 17+** and **TypeScript** examples. That is 66 code questions and 132 code snippets. Switching languages does not count as another question. Snippets isolate the relevant collaboration, rather than claiming to be complete production implementations.

Each answer includes an explanation, reasons the alternatives fit less well, and a direct reference. This independent project is not affiliated with Refactoring.Guru; the questions and examples are original, not copied from its books or site.

## Features

- Quick practice: 10 randomly selected questions, without repeats within a session.
- Study session: 20 questions, prioritizing questions not checked before.
- Full practice: all 132 questions in a stable order.
- Focused practice: filter category, pattern, question type, unseen questions, latest mistakes, or bookmarks; choose shuffle and session size.
- Question navigation, syntax highlighting, Java/TypeScript switching, and explanations after checking.
- Navy-and-amber light theme, dark theme, and a system setting that follows the device appearance.
- Automatically saved selections, including answers not yet checked, current position, language, and shuffled option order.
- Progress by pattern and question type; coverage counts unique checked questions, accuracy counts all checked attempts.
- Review mistakes uses the **latest checked answer** per question. A correct retry removes the question from that pool.
- Restart the session without deleting history, or reset all progress with confirmation.
- Browse read-only session records in Progress. Completed, cancelled, restarted, and replaced sessions retain their answers, question/choice order, language, and score. Delete one record or all session records with confirmation; learning statistics and bookmarks are retained.
- Responsive layout, native keyboard-operable controls, visible focus, and a skip link.

## Run locally

Requires Node.js **22.18+** (Node 24 recommended) and npm. Java is only needed for the example compilation check.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite, normally `http://127.0.0.1:5173/design-pattern-lab/`.

```sh
npm run format        # format source, docs, configuration, and tests with Prettier
npm run lint          # fail if files need formatting or violate source hygiene
npm run check         # lint, strict typecheck, behavioral/data tests, production build
npm run test:examples  # compile every Java and TypeScript snippet; requires JDK 17+
npm run preview       # serve the production build after npm run build
```

Prettier 3 is configured in `.prettierrc.json`; `.prettierignore` excludes generated and installed files. `lint` includes `prettier --check`, so CI and `npm run check` fail if manually edited source is not formatted. Run `npm run format` to apply the rules. Strict TypeScript checking also rejects unused declarations. Tests use Node's built-in test runner, without a test framework dependency. The example checker compiles snippets in isolated temporary directories and removes them afterward.

## GitHub Pages

The repository includes `.github/workflows/deploy.yml`. Pull requests run checks. Pushes to `master`, and manual runs on that branch, run checks and deploy `dist/`.

1. Push the project to the GitHub remote.
2. In **Settings → Pages → Build and deployment**, choose **GitHub Actions** as Source.
3. Run **Check and deploy to GitHub Pages** from the Actions tab, or push a change to the default branch.
4. Open the deployment URL shown in the workflow. For this repository it is expected to be `https://quynguyenn.github.io/design-pattern-lab/`.

`vite.config.ts` sets `base: '/design-pattern-lab/'`. Change this if you rename the repository; use `/` for a custom domain or user-site repository. Hash routes (for example `#/practice`) make refresh and direct navigation work without server rewrite rules. See [Vite's Pages deployment guide](https://vite.dev/guide/static-deploy.html#github-pages).

## Persistence

On desktop, the sidebar can collapse to an icon rail. Its state is saved in browser preferences; narrow layouts retain their compact navigation.

The storage key remains `design-pattern-lab:progress:v1` so existing installations can migrate in place. The payload is version 2 and stores preferences, bookmarks, checked attempt history, the active session, and immutable session records. Version 1 payloads migrate automatically, preserving pending answers and question/choice order. Only the last completed session still present in old saved data can become a session record; older sessions cannot be reconstructed from attempts alone. The saved timestamp records when a snapshot was captured.

Stored IDs, answers, option order, scores, and session records are validated before use. The app warns if browser storage is inaccessible, full, or saved data cannot be loaded. Missing theme preferences default to System, which follows device appearance. Reset all also removes session records.

Data belongs to the current browser and origin, is not synced between devices, and is removed when browser site data is cleared. Changing the port, host, or deployment domain starts a separate local-storage area. There is no login or backend. Google Fonts is optional; system fonts are used if it is unavailable.

## Source layout

```text
src/
  App.tsx                 Compose app state and provide the screen view model
  app-context.tsx        Typed view-model boundary for screen components
  hooks/                  Persistence, browser theme, hash navigation, and learning actions
  styles/                 Design tokens, layout, dashboard, practice, progress, settings, themes, and responsive rules
  screens/                Dashboard, practice, progress, and settings screens
  components/             App shell and shared components by responsibility
  CodeBlock.tsx           Escaped, token-highlighted code display
  engine.ts               Session creation, scoring, filters, statistics, storage validation
  types.ts                Data and progress contracts
  data/
    creational.ts         5 patterns × 6 examples
    structural.ts         7 patterns × 6 examples
    behavioral.ts         10 patterns × 6 examples
    index.ts              Stable question IDs and catalog assembly
  styles.css              Responsive styling
scripts/
  check-examples.ts       Compile all 132 code snippets
  lint.mjs                Source hygiene checks
tests/
  engine.test.ts          Data integrity and learning-state regression tests
```

## Editing the questions

Each pattern record has two basic scenarios, one comparison scenario, two code examples, and one refactoring exercise. Every code example must contain both `java` and `typescript`, a prompt, and an explanation. Alternatives refer to pattern IDs, with a rationale for each alternative. The assembled questions use IDs such as `strategy-4`.

Keep existing pattern IDs and the six example positions stable when editing wording, so saved progress continues to refer to the same question. If you change the question identity or storage shape, add a migration or deliberately bump the storage version rather than silently remapping old answers. Run both `npm run check` and `npm run test:examples` after content changes.

Content review should verify that a question has one best answer under its stated constraints, that both languages express the same collaboration, and that the class names do not reveal the pattern unnecessarily.

## Agent guidance and contribution workflow

- [AGENTS.md](AGENTS.md): repository conventions, learning-state invariants, and relevant checks.
- [Design pattern content skill](.agents/skills/design-pattern-content/SKILL.md): authoring and reviewing questions with equivalent Java/TypeScript examples. Invoke as `$design-pattern-content` in a compatible agent session, or point the agent at this file.
- [Branching strategy](docs/branching-strategy.md): GitHub Flow using the existing `master` branch, short-lived topic branches, PR checks, and squash merging. Remote protection settings remain a proposal.
