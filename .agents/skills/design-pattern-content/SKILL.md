---
name: design-pattern-content
description: Author, revise, or review Design Pattern Lab quiz questions and equivalent Java/TypeScript examples. Use for this repository's scenarios, pattern distinctions, explanations, distractors, and content validation.
---

# Design Pattern Lab content

Produce original English questions that teach a pattern's intent and the constraints that make it appropriate. Work within the requested content scope; a request for one correction is not a request to regenerate the collection.

## Read the relevant contracts

Find the repository root containing `package.json` and `src/data/index.ts`. Read its [AGENTS.md](../../../AGENTS.md), [types](../../../src/types.ts), and [question assembly](../../../src/data/index.ts), then the affected pattern record in `src/data/`.

The current schema stores six examples per pattern:

| Slot / ID suffix | Field                          | Learning objective                                    |
| ---------------- | ------------------------------ | ----------------------------------------------------- |
| 1, 2             | `scenarios[0]`, `scenarios[1]` | Recognize intent from two different situations        |
| 3                | `scenarios[2]`                 | Distinguish a plausible competing pattern             |
| 4, 5             | `code[0]`, `code[1]`           | Identify collaborations in two code examples          |
| 6                | `refactor`                     | Select a pattern under an explicit change requirement |

`alternatives` and aligned `contrasts` are shared across all six examples. Review every affected question when changing those fields. Questions, references, and option rotations are assembled by `index.ts`; edit the source records rather than generated results. Preserve slot identities for saved progress.

## Write and review questions

Make the intended best answer defensible from the stated requirements. Identify the strongest alternative and explain which concrete constraint makes it a weaker fit. If both fit equally well, fix the prompt or options rather than using an absolute claim about pattern correctness.

Distinguish intent from similar structure. In particular, check lifecycle transitions versus interchangeable algorithms, interface translation versus added responsibilities versus access control, subclass creation hooks versus product families, and state snapshots versus action objects.

For refactoring questions, show the starting code and the requested flexibility or behavior. Code that merely looks repetitive is insufficient evidence that a specific pattern is needed. Do not imply that every conditional or constructor needs a pattern.

Use realistic domain names. Avoid labels such as `ConcreteStrategy` that answer a recognition question. Explain the roles of the actual classes/methods shown, not only a generic pattern definition. Each distractor needs a reason relevant to the question; update the shared contrasts only if they remain valid across the pattern's six questions.

Write original scenarios, code, and explanations. Consult the corresponding `https://refactoring.guru/design-patterns/{pattern-id}` page when verifying an unfamiliar distinction or reference. Link to the pattern page rather than reproducing source text or illustrations.

## Keep both languages equivalent

Every code-recognition and refactoring example needs `code.java` and `code.typescript`. Preserve the same collaboration, lifecycle, and correct answer while using natural syntax in each language.

Use Java 17-compatible features and modern TypeScript. Include required Java imports and helper types. Each snippet must compile independently under `scripts/check-examples.ts`; TypeScript examples are checked as isolated modules. Avoid package declarations, external dependencies, and public Java classes requiring another filename unless the checker is intentionally updated.

Check semantics as well as compilation: delegation versus inheritance, mutable versus shared state, independent copies, access restrictions, and transition ownership. Examples can be minimal, but their simplifications must not contradict the concept being taught. Avoid universal concurrency or distributed-lifetime claims for process-local examples.

## Verify and hand off

After content edits, run from the repository root:

```sh
npm run check
npm run test:examples
```

Review the affected questions in both languages when the UI is available. Compilation establishes syntax/type correctness, not that the answer or distractors are pedagogically sound.

Report which patterns/slots changed, meaningful ambiguity resolved, and verification results. If the user explicitly expands the collection, update counts, assembly, tests, and documentation together; do not keep a misleading 132-question claim. Call out any effect on saved question identity.
