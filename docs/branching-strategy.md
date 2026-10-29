# Branching strategy

Status: adopted for local branch, commit, push, and PR management. Remote branch protection and merge settings below remain recommendations; their configuration has not been verified.

## GitHub Flow

Use one stable branch, `master`, and short-lived topic branches merged through pull requests. This fits a small SPA with one production deployment and frequent improvements to questions and UI. Keep the existing default branch name; there is no current need for a separate `develop` or release branch.

```text
master ────────────────●────────────────●──→ GitHub Pages
   └─ feat/bookmarks ──┘                │
                       └─ content/state-examples ─┘
```

The deployment boundary is the merge to `master`. A branch and its pull request are the unit of review; a successful deployment is a separate result to verify.

## Branch names

| Prefix      | Purpose                          | Example                              |
| ----------- | -------------------------------- | ------------------------------------ |
| `feat/`     | New behavior                     | `feat/spaced-repetition`             |
| `fix/`      | Bug correction                   | `fix/restore-pending-answer`         |
| `content/`  | Quiz content                     | `content/strategy-state-distinction` |
| `refactor/` | Internal restructuring           | `refactor/practice-components`       |
| `docs/`     | Documentation and agent guidance | `docs/contributor-workflow`          |
| `chore/`    | Dependencies and tooling         | `chore/update-vite`                  |
| `hotfix/`   | Urgent production correction     | `hotfix/pages-base-path`             |

Keep one coherent change per branch. A hotfix still follows a focused PR with relevant checks; it does not need a permanent hotfix branch.

## Normal change lifecycle

Starting with a clean working tree and a current `master`:

```sh
git switch master
git pull --ff-only origin master
git switch -c feat/spaced-repetition
```

Implement and verify the change. For application/content work, use `npm run check`; content changes also run `npm run test:examples`. Open a PR targeting `master` with the resulting behavior and validation evidence. Use a draft PR when the work is still incomplete.

After checks and review, prefer **Squash and merge**, then remove the merged topic branch. A useful squash title is `feat: add spaced repetition` or `content: clarify Strategy versus State`. This keeps each PR as one reviewable, revertible change on the stable branch.

For a solo-maintained repository, review your own diff and CI results before merging. Do not require an approval by another reviewer until someone is available to provide it. With collaborators, one independent approval is a reasonable default.

## Initial application handoff

The initial implementation is on `feat/initial-app`, targeting `master`. Keep related initial-review fixes on that branch until the PR is merged. Future independent changes start from an updated `master` after preserving any unfinished work.

The user has authorized agents to manage topic branches, commits, pushes, and PRs proactively. This does not grant automatic merge permission. When network access is unavailable, prepare the local commit and PR description and report the outstanding push/PR steps.

## Suggested GitHub settings

For `master`, once the initial CI check has appeared:

- Require a pull request and the successful build/test check from this repository's workflow. Select its actual displayed check name in GitHub after the first run.
- Require unresolved review conversations to be addressed.
- Disable force pushes and branch deletion on the stable branch.
- Prefer squash merging and automatic cleanup of merged topic branches.
- For solo work, keep required external approvals at zero; raise to one when an independent reviewer is available.

These are proposed remote settings, not changes made by this document. Branch protection availability depends on repository visibility and the GitHub plan; consult the linked documentation when configuring it.

## CI and Pages alignment

The current `.github/workflows/deploy.yml` checks PRs targeting `master`, and deploys pushes/manual runs on `master` only. Set Pages Source to **GitHub Actions**. PR checks do not publish preview sites in the current workflow.

Do not make a successful production deployment a required pre-merge check: this workflow deploys after merge. Require the build/test job for the PR, then verify the Pages deployment and smoke-test the published app afterward.

## Releases and rollback

Optional tags such as `v0.1.0` can mark verified milestones on `master`. Tags do not trigger deployment in the current workflow; deployment follows the branch update.

For a faulty release, prefer a revert PR against `master` and let CI publish the corrected history. Reverting source does not automatically reverse browser local-storage migrations. For persistence changes, assess compatibility with already-written data before reverting; a forward fix may be safer.

Introduce a separate staging environment only when there is a concrete need to validate deployments before production. That would require an intentional workflow/environment change, not merely adding a `develop` branch.

## References

This project-specific recommendation adapts [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow). GitHub documents configurable restrictions in [About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).
