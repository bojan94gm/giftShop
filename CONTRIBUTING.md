# Contributing

This repository uses a Gitflow-style workflow with `main` for production-ready code and `develop` for integration. Feature, fix, test, docs and chore branches must target `develop` unless a hotfix is explicitly approved.

## Branch Naming

Use short, scoped branch names:

- `feature/<short-description>` for user-facing backend features.
- `fix/<short-description>` for defects and regressions.
- `test/<short-description>` for automated test work.
- `docs/<short-description>` for documentation-only work.
- `chore/<short-description>` for CI, tooling and repository maintenance.
- `feat/<short-description>` is accepted for Conventional Commit alignment when the branch is explicitly planned.

The QA uplift branch map is documented in [docs/gitflow.md](docs/gitflow.md).

## Commit Convention

Use Conventional Commits:

- `feat:` for new behavior.
- `fix:` for defect fixes.
- `test:` for automated or manual test assets.
- `docs:` for documentation.
- `chore:` for maintenance, tooling and repository setup.
- `ci:` for CI/CD pipeline changes.

Each bug fix must include a regression test or a documented reason why the test cannot be automated in the same PR.

## Pull Request Rules

- Target `develop` by default.
- Keep PRs small and scoped to one branch purpose.
- Do not change the public API contract without calling it out in the PR description.
- Include acceptance criteria and test evidence.
- Link related defects, requirements or test cases when available.
- Do not commit secrets, local `.env` files or production data.
- Request review from the CODEOWNER before merge.

## Local Checks

Before opening a PR, run the checks that exist for the branch scope. At baseline this project has no test script yet; API automation will add `npm test` in a dedicated `test/api-automation` branch.
