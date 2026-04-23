# Gitflow

## Branch Model

- `main` is the production-ready branch.
- `develop` is the protected integration branch for QA uplift work.
- Work branches are created from `develop` and merged back through pull requests.
- Hotfixes branch from `main`, then merge into both `main` and `develop`.

## Required QA Uplift Branches

The following local branches are reserved for the QA uplift roadmap:

- `docs/qa-uplift`
- `test/api-automation`
- `fix/auth-refresh-flow`
- `fix/logout-cookies`
- `fix/token-model-user`
- `fix/orders-admin-authz`
- `fix/orders-get-status-code`
- `fix/public-catalog`
- `chore/ci-pipeline`
- `chore/structured-logger`
- `feat/seed-scripts`
- `feat/sql-demo`
- `feat/docker`

This baseline work is prepared on `chore/repo-baseline` and targets `develop`.

## Merge Rules

- All QA uplift branches target `develop`.
- Use squash merge or rebase merge to keep history readable.
- A branch must not mix unrelated scopes, for example `fix/auth-refresh-flow` should not add CI files.
- Regression tests must be added with every bug fix branch.
- Public API changes must be explicitly documented in the PR description.

## Branch Protection

Protect `develop` in the Git hosting settings with:

- Pull request required before merge.
- At least one approving review.
- CODEOWNERS review required.
- Required status checks after CI is introduced.
- Linear history enabled.
- Direct pushes disabled.
- Force pushes disabled.
- Branch deletion disabled.

Local Git cannot enforce hosted branch protection; this must be configured in GitHub repository settings.
